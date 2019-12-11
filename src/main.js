const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const glob = util.promisify(require('glob'));
const spawn = util.promisify(require('child_process').spawn);

function getCommandline() {
	return require('yargs')
		.command('$0 <files> <cmd> [args..]', 'Runs <cmd> once for every file in <files>', yargs => {
			yargs
				.positional('files', {
					describe: 'glob pattern of the files you wish to find',
					type: 'string'
				})
				.positional('cmd', {
					describe: 'command to run for each file',
					type: 'string'
				})
				.positional('args', {
					describe: 'additional arguments for <cmd>',
					type: 'string'
				});
		})
		.option('out', {
			describe: 'file path to redirect standard out',
			type: 'string'
		})
		.option('err', {
			describe: 'file path to redirect standard error',
			type: 'string'
		})
		.help().argv;
}

async function runOne(file, opts) {
	let out = null;
	let err = null;

	const fileProps = path.parse(file);

	const fileName = fileProps.base;
	const fileBaseName = fileProps.name;
	const filePath = file;
	const fileDir = fileProps.dir;

	const substitute = a =>
		a
			.replace(/\{file\}/gi, fileName)
			.replace(/\{basefile\}/gi, fileBaseName)
			.replace(/\{path\}/gi, filePath)
			.replace(/\{dir\}/gi, fileDir);

	const args = opts.args.map(substitute);

	const fout = opts.out ? substitute(opts.out) : null;
	const ferr = opts.err ? substitute(opts.err) : null;

	try {
		if (fout) {
			await fs.mkdir(path.dirname(fout), { recursive: true });
			out = await fs.open(fout, 'w');
		} else {
			out = 1;
		}

		if (ferr) {
			await fs.mkdir(path.dirname(ferr), { recursive: true });
			err = await fs.open(ferr, 'w');
		} else {
			err = 2;
		}

		const spawnOpts = { stdio: [0, out, err] };

		await spawn(opts.cmd, args, spawnOpts);
	} finally {
		if (fout) await out.close();
		if (ferr) await err.close();
	}
}

async function run(files, opts) {
	const processes = files.map(f => runOne(f, opts));
	return await Promise.all(processes.map(p => p.catch(e => e)));
}

async function getFiles(pattern) {
	const globOpts = { nodir: true };
	return await glob(pattern, globOpts);
}

async function main() {
	const argv = getCommandline();
	const files = await getFiles(argv.files);

	if (files.length == 0) {
		console.error('No files found, exiting...');
		return;
	}

	try {
		const results = await run(files, argv);

		for (let i = 0; i < files.length; ++i) {
			if (results[i] instanceof Error) {
				console.error(`With ${files[i]}: ${results[i].message}`);
			}
		}
	} catch (e) {
		console.error(e);
	}
}

main();
