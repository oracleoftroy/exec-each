# exec-each

Run a command multiple times against a file glob pattern. There are several utilities that do similar things; the main advantage of exec-each is the ability to redirect standard out and standard error to a custom file for each input file.

## Usage

`exec-each <files> <cmd> [-- args..]`

Runs <cmd> once for every file in <files>

### Arguments:

`files` - glob pattern of the files you wish to find

`cmd` - command to run for each file

`args` - additional arguments for <cmd>, supports substitutions. Arguments for <cmd> should be preceded by `--`

### Options:

`--out` - file path to redirect standard out, supports substitutions. Defaults to stdout.

`--err` - file path to redirect standard err, supports substitutions. Defaults to stderr.

`--dry-run` - show what commands will be run without running anything

`--help` - Show help

`--version` - Show version number

### Substitutions:

exec-each will replace the following strings in the command's arguments, as well as the out or err file specified with a string based on the file matched by the glob pattern.

`{path}` - the full path to the file. E.g. `./dir/file.txt`

`{dir}` - the directory containing the file. E.g. `./dir`

`{file}` - the full name of the file. E.g. `file.txt`

`{basefile}` - the file name of the file without the extension. E.g. `file`

### Example:

    exec-each --out docs/{basefile}.md src/*.js jsdoc2md -- {path}
