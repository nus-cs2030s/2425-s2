# Vim Extensions on PE Hosts

CS2030S provides a minimal set of vim extensions (i.e., plugins and color schemes) officially.  At the beginning of the semester, students can install the same set of extensions following the [vim setup](setup.md) procedure.
The same set of official extensions will be made available during the practical exams.

Students are free to install any additional color schemes or plugins if they wish.  These additional extensions, however, are not allowed and will not be available during the practical exams.

The following are the officially supported vim extensions in CS2030S.  Follow the instructions in our article [Setting Up Vim](setup.md) to install them.

## Color Schemes

We provided three color schemes in `~cs2030s/.vim/colors`.


The three color schemes are:

- [gruvbox](https://github.com/morhetz/gruvbox)
- [molokai](https://github.com/tomasr/molokai)
- [onedark](https://github.com/joshdick/onedark.vim)

You can change your vim color scheme using the `:color` command.  For instance,

```
:color gruvbox
```

You can add the line `color gruvbox` (without `:`) to your `~/.vimrc` so that the color scheme is loaded at the start of every vim session.

Some color schemes display differently depending on whether the background is set to `dark` or `light`

Some examples, with `set background=dark` in `~/.vimrc`:

The Vim default color scheme:

![default](figures/color-scheme-default.png)

The molokai (CS2030S default) color scheme:

![molokai](figures/color-scheme-molokai.png)

The gruvbox color scheme 

![gruvbox](figures/color-scheme-gruvbox.png)

## Plugins

We support two plugins for CS2030S.

### Airline
The [Airline plugin](https://vimawesome.com/plugin/vim-airline-superman), which provides an informative status bar in vim.

### Syntastic
The plugin [syntastic](https://github.com/vim-syntastic/syntastic) automatically checks for syntax and style errors every time a file is saved (when you run `:w`).

The syntastic configuration in the CS2030S `~/.vimrc` has been made to work with your PE hosts.
