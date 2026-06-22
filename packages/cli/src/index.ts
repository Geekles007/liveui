import { Command } from 'commander';
import { red } from 'kleur/colors';
import { add } from './commands/add.js';
import { gen } from './commands/gen.js';
import { list } from './commands/list.js';
import { upgrade } from './commands/upgrade.js';

const program = new Command();

program
  .name('everstate')
  .description('State-complete, accessible, upgradeable components — installed into your project.')
  .version('0.0.0');

program
  .command('add')
  .description('Add one or more items (with their dependencies) to your project.')
  .argument('<items...>', 'item name(s) to add')
  .option('-r, --registry <url>', 'registry base URL')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .option('-o, --overwrite', 'overwrite existing files', false)
  .action(async (items: string[], options) => {
    await add(items, options);
  });

program
  .command('upgrade')
  .description('Update installed items, preserving your local edits (3-way safe).')
  .argument('[items...]', 'item name(s) to upgrade (default: all in everstate.lock.json)')
  .option('-r, --registry <url>', 'registry base URL')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .action(async (items: string[], options) => {
    await upgrade(items, options);
  });

program
  .command('gen')
  .description('Suggest components for a natural-language prompt (AI manifest).')
  .argument('<prompt>', 'what you want to build, in plain language')
  .option('-r, --registry <url>', 'registry base URL')
  .action(async (prompt: string, options) => {
    await gen(prompt, options);
  });

program
  .command('list')
  .alias('ls')
  .description('List every item available in the registry.')
  .option('-r, --registry <url>', 'registry base URL')
  .action(async (options) => {
    await list(options);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
