import { itemAt, testcase } from "./utils";

describe("Basic Usage", () => {
  testcase(
    "simple resource definition",
    {
      ts: () => `
new DockerProvider(this, "provider", {});
new docker.Container(this, "nginxContainer", {
    image: "nginx:latest",
    name: "tutorial",
    ports: [
        {
            internal: 80,
            external: 8000,
        },
    ],
});
    `,
    },
    (synthOutput) => {
      expect(
        itemAt(
          synthOutput,
          "resource.docker_container",
          "nginxContainer",
          "name"
        )
      ).toBe("tutorial");
      expect(
        itemAt(
          synthOutput,
          "resource.docker_container",
          "nginxContainer",
          "ports.0.internal"
        )
      ).toBe(80);
    }
  );
});
