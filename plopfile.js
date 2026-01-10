/** @type {import('plop').PlopConfig} */
export default function (plop) {
  // Helper: convert to PascalCase
  plop.setHelper("pascalCase", (text) => {
    return text
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  });

  // Helper: convert to camelCase
  plop.setHelper("camelCase", (text) => {
    return text
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  });

  // Feature generator
  plop.setGenerator("feature", {
    description: "Generate a new feature with route, usecases, and repository",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case, e.g., 'reminder' or 'task-label'):",
        validate: (value) => {
          if (/^[a-z][a-z0-9-]*$/.test(value)) {
            return true;
          }
          return "Feature name must be kebab-case (lowercase letters, numbers, hyphens)";
        },
      },
    ],
    actions: [
      // Domain: Repository Interface
      {
        type: "add",
        path: "packages/backend/src/domain/infra/{{camelCase name}}Repo.ts",
        templateFile: "plop-templates/backend/domain/repo.ts.hbs",
      },
      // Infra: Drizzle Repository Implementation
      {
        type: "add",
        path: "packages/backend/src/infra/drizzle/{{camelCase name}}Repo.ts",
        templateFile: "plop-templates/backend/infra/drizzleRepo.ts.hbs",
      },
      // Feature: Route
      {
        type: "add",
        path: "packages/backend/src/feature/{{name}}/route.ts",
        templateFile: "plop-templates/backend/feature/route.ts.hbs",
      },
      // Feature: Usecases
      {
        type: "add",
        path: "packages/backend/src/feature/{{name}}/usecase/create{{pascalCase name}}.ts",
        templateFile: "plop-templates/backend/feature/usecase/create.ts.hbs",
      },
      {
        type: "add",
        path: "packages/backend/src/feature/{{name}}/usecase/get{{pascalCase name}}s.ts",
        templateFile: "plop-templates/backend/feature/usecase/getAll.ts.hbs",
      },
      {
        type: "add",
        path: "packages/backend/src/feature/{{name}}/usecase/update{{pascalCase name}}.ts",
        templateFile: "plop-templates/backend/feature/usecase/update.ts.hbs",
      },
      {
        type: "add",
        path: "packages/backend/src/feature/{{name}}/usecase/delete{{pascalCase name}}.ts",
        templateFile: "plop-templates/backend/feature/usecase/delete.ts.hbs",
      },
      // Instructions
      function (answers) {
        const { name } = answers;
        const camelCase = name
          .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
          .replace(/^(.)/, (_, c) => c.toLowerCase());
        return `
Feature generated successfully!

Next steps:
1. Add schema to shared package:
   - packages/shared/src/schemas/${name}.ts
   - Export from packages/shared/src/index.ts

2. Add Drizzle table to schema:
   - packages/backend/src/infra/drizzle/schema.ts

3. Complete TODOs in generated files:
   - Fill in toEntity/toRow field mappings in drizzle repo
   - Add custom query methods if needed

4. Register route in src/route.ts:
   import { ${camelCase}Route } from "./feature/${name}/route";
   .route("/${name}s", ${camelCase}Route)

5. Add test DB schema to test/helpers.ts
`;
      },
    ],
  });
}
