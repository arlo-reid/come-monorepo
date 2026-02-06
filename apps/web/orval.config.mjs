export default {
  coreapi: {
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
    input: {
      target: "http://localhost:8000/api/docs/json",
    },
    output: {
      client: "react-query",
      mode: "tags-split",
      override: {
        mutator: {
          name: "axiosClient",
          path: "src/lib/api.ts",
        },
        operations: {
        },
      },
      schemas: "src/generated/model",
      target: "src/generated/coreapi.ts",
    },
  },
};
