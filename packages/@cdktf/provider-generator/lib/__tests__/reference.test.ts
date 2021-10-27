import { itemAt, testcase, regexForReference } from "./utils";

describe("References", () => {
  testcase(
    "top-level references",
    {
      ts: () => `
new DockerProvider(this, "provider", {});
const dockerImage = new Image(this, "nginxImage", {
    name: "nginx:latest",
    keepLocally: false,
});
new docker.Container(this, "nginxContainer", {
    image: dockerImage.latest,
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
          "image"
        )
      ).toMatch(regexForReference("docker_image", "nginxImage", "latest"));
    }
  );
});
