import { apply, applyTemplates, chain, mergeWith, move, Rule, strings, Tree, url } from '@angular-devkit/schematics';
import {
  addDeclarationToNgModule
} from '@schematics/angular/utility/add-declaration-to-ng-module'
import { findModuleFromOptions } from '@schematics/angular/utility/find-module'
import { getWorkspace } from '@schematics/angular/utility/workspace'
import { parseName } from '@schematics/angular/utility/parse-name'

interface VVCOptions {
  name: string;
  path: string;
}

function buildSelector(options: VVCOptions, projectPrefix: string) {
  return `${projectPrefix}-${strings.dasherize(options.name)}`;
}

export default function (options: VVCOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree),
      projects = Array.from(workspace.projects.entries());

    if (projects.length > 1) {
      throw new Error('Multiple projects are not supported yet.');
    }

    const project = projects[0][1];

    const selector = buildSelector(options, project.prefix || '');

    const parsedPath = parseName(options.path as string, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...strings,
        ...options,
        selector,
      }),
      move(parsedPath.path),
    ]);

    return chain([
      mergeWith(templateSource),
      addDeclarationToNgModule({
        type: 'component',
        ...options,
        module: findModuleFromOptions(tree, options),
        skipImport: false
      })
    ]);
  };
}
