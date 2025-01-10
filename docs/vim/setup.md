# Setting Up `vim` on PE Hosts

## `vim` Configuration

Like many other Unix programs, you can configure your preferences by creating an `rc` (run commands) file in your home directory.  These `rc` files will be read by the corresponding programs and executed line-by-line as if the text is entered into the program through a keyboard.  You can view an `rc` file as a script that will be executed automatically whenever a program starts.

For `vim`, the `rc` file is called `.vimrc`.  The dot (_i.e._, `.`) in the front of the file name carries a special meaning in Unix.  It means that this file is hidden &mdash; you won't see it when you `ls`.  Hiding the run command files prevent your home directory from being cluttered.  To tell `ls` to show the hidden files, use the `-a` flag

```Bash
$ ls -a
```

We have created a `.vimrc` file, with CS2030S defaults, for your use.  This is the basis upon which you can build your own configuration. 

To copy this file to your home directory on the PE nodes,

```Bash
$ cp ~cs2030s/.vimrc ~
```

You can ask `vim` to automatically back up the files that you edit.  This has been a lifesaver for me on multiple occasions.

The default `.vimrc` contains the following two lines:

```Shell
set backup
set backupdir=~/.backup
```

This causes `vim` to save the previous version of every file you edited in a backup directory at location `~/.backup`.  You need to create this directory, however, by

```Bash
$ mkdir -p ~/.backup
```

Now, if you made changes to a file that you regretted, or if you accidentally deleted a file, you can check under `~/.backup` to see if the backup can save you.

### Recovering from Backup

To recover the file from the backup folder, you can copy the file using

```Bash
$ cp ~/.backup/<filename> <destination>/<filename>
```

## `vim` Extensions

CS2030S provides a minimal set of `vim` extensions by default for your programming exercises and practical exams.  See the article on [`vim` extensions](plugins.md) for details.  

Additional `vim` extensions are installed under `~/.vim`.  To install these "official" CS2030S `vim` extensions, you can copy the `.vim` from cs2030s's home directory to your home directory.  On the PE host, run:

```Bash
mkdir -p ~/.vim
cp -r ~cs2030s/.vim/* ~/.vim
```

You can test out the different color schemes according to the [instructions](plugins.md) to check if you have set up the extensions correctly.  The default CS2030S `.vimrc` uses the `molokai` color schemes.
