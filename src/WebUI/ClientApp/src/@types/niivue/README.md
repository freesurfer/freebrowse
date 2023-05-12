# Niivue types

This types has been generated with the following command inside the niivue git repository as mentioned [here](https://github.com/niivue/niivue/blob/main/docs/development-notes/angular-typescript.md).

```bash
npx -p typescript tsc src/*.js --lib ESNext,dom --declaration --allowJs --emitDeclarationOnly --outDir types
```

Executing the command failed with some errors like

```log
... - error TS9005: Declaration emit for this file requires using private name '<>'. An explicit type annotation may unblock declaration emit.
```

To solve this issue, you need to change the declarations like

```ts
export const colortables = function () {
```

to 

```ts
export function colortables () {
```

After a successful creation of the types, we need to copy the whole folder in our project and put the module definition around the most important classes.

```ts
declare module '@niivue/niivue' {
    ...
}
```

also (if we do not want to adapt the style to our defined eslint ruleset, we need to add in most files some linter ignore commands)

```ts
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
```

and also remove functions, where there are defined classes with the same name as well.

Afterwards the whole types should be easy to use from the project code.

## Hint

Not all types seem to be resolved properly. We should try to define as much **any** as possible. If we recreate the types, we should do a diff to not override too much of the adapted types.

## Module

To make the types automatically used, when using the niivue library, in nearly every file of the generated files, we need to wrap the whole generated code into the according module.

```ts
declare module '@niivue/niivue' {
    ...
}
```

This should keep it scoped, so less name clashes.
And wire it properly to the library and internally between the type files.