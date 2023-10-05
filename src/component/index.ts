import { apply, applyTemplates, chain, mergeWith, move, Rule, strings, Tree, url } from '@angular-devkit/schematics';
import { workspaces } from '@angular-devkit/core';

export async function getWorkspace(tree: Tree, path = '/angular.json'): Promise<workspaces.WorkspaceDefinition> {
  const host = new TreeWorkspaceHost(tree);

  const { workspace } = await workspaces.readWorkspace(path, host);

  return workspace;
}

class TreeWorkspaceHost implements workspaces.WorkspaceHost {
  constructor(private readonly tree: Tree) {}

  async readFile(path: string): Promise<string> {
    return this.tree.readText(path);
  }

  async writeFile(path: string, data: string): Promise<void> {
    if (this.tree.exists(path)) {
      this.tree.overwrite(path, data);
    } else {
      this.tree.create(path, data);
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    // approximate a directory check
    return !this.tree.exists(path) && this.tree.getDir(path).subfiles.length > 0;
  }

  async isFile(path: string): Promise<boolean> {
    return this.tree.exists(path);
  }
}

function buildSelector(options: { name: string }, projectPrefix: string) {
  return `${projectPrefix}-${strings.dasherize(options.name)}`;
}

export default function (options: { name: string }): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree),
      projects = Array.from(workspace.projects.entries());

    if (projects.length > 1) {
      throw new Error('Multiple projects are not supported yet.');
    }

    const project = projects[0][1];

    const selector = buildSelector(options, project.prefix || '');

    console.log(selector);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...strings,
        ...options,
        selector,
      }),
      move('./playground'),
    ]);

    return chain([mergeWith(templateSource)]);
  };
}
