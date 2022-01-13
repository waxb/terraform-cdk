import * as path from "path";
import { Construct } from "constructs";
import { TerraformBackend } from "../terraform-backend";
import { keysToSnakeCase } from "../util";
import {
  TerraformRemoteState,
  DataTerraformRemoteStateConfig,
} from "../terraform-remote-state";
import { TerraformStack } from "..";

export class LocalBackend extends TerraformBackend {
  private readonly props: LocalBackendProps;
  constructor(scope: Construct, props: LocalBackendProps = {}) {
    super(scope, "backend", "local");

    const stackId = TerraformStack.of(this).node.id;
    this.props = {
      ...props,
      path:
        props.path || path.join(process.cwd(), `terraform.${stackId}.tfstate`),
    };
  }

  protected synthesizeAttributes(): { [name: string]: any } {
    return keysToSnakeCase({ ...this.props });
  }

  public getRemoteStateDataSource(
    scope: Construct,
    name: string,
    fromStack: string
  ): TerraformRemoteState {
    return new DataTerraformRemoteStateLocal(scope, name, {
      workspace: this.props.workspaceDir,
      path:
        this.props.path ||
        path.join(process.cwd(), `terraform.${fromStack}.tfstate`),
    });
  }
}

export class DataTerraformRemoteStateLocal extends TerraformRemoteState {
  constructor(
    scope: Construct,
    id: string,
    config: DataTerraformRemoteStateLocalConfig
  ) {
    super(scope, id, "local", config);
  }
}

export interface LocalBackendProps {
  /**
   * Path where the state file is stored.
   * @default - defaults to terraform.${stackId}.tfstate
   */
  readonly path?: string;
  readonly workspaceDir?: string;
}

export interface DataTerraformRemoteStateLocalConfig
  extends DataTerraformRemoteStateConfig,
    LocalBackendProps {}
