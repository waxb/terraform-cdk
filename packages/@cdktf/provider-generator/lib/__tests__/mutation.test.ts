import { itemAt, testcase } from "./utils";

describe("Mutation", () => {
  testcase(
    "mutating top-level primitives",
    {
      ts: () => `
new DockerProvider(this, "provider", {});
const container = new docker.Container(this, "nginxContainer", {
    image: "not-set",
    name: "tutorial",
    ports: [
        {
            internal: 80,
            external: 8000,
        },
    ],
});
container.image = "nginx:latest"
    `,
    },
    (synthOutput) => {
      expect(
        itemAt(
          synthOutput,
          "resource.docker_container",
          "nginxContainer",
          "image"
        )
      ).toEqual("nginx:latest");
    }
  );
});
