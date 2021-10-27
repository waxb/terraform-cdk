import { execSync } from "child_process";
import * as fs from "fs-extra";
import path from "path";
import { sscaff } from "sscaff";
import { ConstructsMaker, Language } from "..";
import {
  TerraformDependencyConstraint,
  TerraformProviderConstraint,
} from "../config";
import { mkdtemp } from "../util";

type Assertions = (hclJson: Record<string, any>) => void;
type Action = { ts: () => string };

const pathToProviderSchema = path.join(
  __dirname,
  "fixtures",
  "provider-fixture.json"
);

const constraints: TerraformDependencyConstraint[] = [
  new TerraformProviderConstraint("kreuzwerker/docker@= 2.15.0"),
];

let generatedProvidersPath: Promise<string> | undefined;
async function getGeneratedProvidersPath() {
  if (generatedProvidersPath) return generatedProvidersPath;
  // Create a project and return its path
  return await mkdtemp(async (workdir) => {
    const jsiiPath = path.join(workdir, ".jsii");

    // TODO: do this for all languages
    const maker = new ConstructsMaker(
      {
        codeMakerOutput: workdir,
        outputJsii: jsiiPath,
        targetLanguage: Language.TYPESCRIPT,
      },
      constraints
    );

    // generate code for schema
    await maker.generate(
      JSON.parse(fs.readFileSync(pathToProviderSchema, "utf8"))
    );

    console.log("workdir", workdir);
  }, true);
}

async function createAndSynthProject(
  name: string,
  constructDefinitions: string
) {
  let synthedHcl = "";
  const cliPkg = path.resolve(__dirname, "..", "..", "..", "..", "cdktf-cli");
  const localCdkPath = path.resolve(cliPkg, "bin", "cdktf");
  const templatePath = path.resolve(cliPkg, "templates", "typescript");

  const providerImports = `
// TS Provider imoprts

import * as docker from "./.gen/providers/docker";
`;
  const projectName = name;
  const deps = {}; // TODO: add dependencies
  const projectInfo = { projectName };

  // Create Dir
  await mkdtemp(async (workdir) => {
    // Copy over template files
    await sscaff(templatePath, workdir, {
      ...deps,
      ...projectInfo,
      futureFlags: "",
      projectId: "provider-generator-test",
    });

    // Set Construct definitions in the package
    const indexFilePath = path.join(workdir, "index.ts");
    const indexFile = fs.readFileSync(indexFilePath, "utf8");
    const cdktfImport = `from "cdktf";`;
    const insertionPoint = indexFile.indexOf(cdktfImport) + cdktfImport.length;
    indexFile.substring(0, insertionPoint) +
      providerImports +
      indexFile.substring(insertionPoint);

    indexFile.replace("// define resources here", constructDefinitions);
    fs.writeFileSync(indexFilePath, indexFile, "utf8");

    // Copy over generated providers
    const generatedProvidersPath = await getGeneratedProvidersPath();
    if (!generatedProvidersPath) {
      throw new Error("Could not find generated providers");
    }
    fs.copy(generatedProvidersPath, path.join(workdir, "gen"));

    // Synth
    execSync(`${localCdkPath} synth`, { cwd: workdir });

    // Set synthed output
    synthedHcl = fs.readFileSync(
      path.join(workdir, "cdktf.out", "stacks", projectName, "cdk.tf.json"),
      "utf8"
    );
  });

  return synthedHcl;
}

// TODO: add more languages to action
export function testcase(name: string, action: Action, assertion: Assertions) {
  describe(name, () => {
    Object.entries(action).forEach(([k, v]) => {
      it(k, async () => {
        const constructDefinitions = v();
        const hclJson = await createAndSynthProject(name, constructDefinitions);
        assertion(JSON.parse(hclJson));
      });
    });
  });
}

export function itemAt(
  synthOutput: Record<string, any>,
  resourceAddress: string,
  itemName: string,
  propertyAddress: string
) {
  console.log(
    "itemAt",
    synthOutput,
    resourceAddress,
    itemName,
    propertyAddress
  );
  return "42";
}

export function regexForReference(
  resourceType: string,
  resourceName: string,
  property: string
): RegExp {
  // Regex should match ${resourceType.foo_resourceName_bar.property}
  return new RegExp(`\\$\\{${resourceType}.*_${resourceName}_*.${property}\\}`);
}
