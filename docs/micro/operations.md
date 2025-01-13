# Micro HOWTO: Common Code Editing Operations

## Micro as a Source Code Editor

A source code editor is more than a text editor.  A source code editor is designed and optimized for common operations performed by a programmer while programming.  In this article, we summarize some common operations that you will likely perform and how you will perform them in Micro.

## Code Browsing

!!! Quote "Reading vs. Writing"

    “.. the ratio of time spent reading versus writing is well over 10 to 1. We are constantly reading old code as part of the effort to write new code." 

    ― Robert C. Martin, Clean Code: A Handbook of Agile Software Craftsmanship

### Navigation Within a File

_You need to go beyond using arrow keys to move character-by-character or line-by-line for better efficiency and productivity._  Some useful operations are:

| Operation       | Cursor Position | Forward        |  Backward   | |
|-----------------|-|----------------|-------------|-|
| Move word-by-word | Anywhere | ++alt+++++arrow-right++ | ++alt+++++arrow-left++ | (Might not work on macOS due to conflict in keyboard shortcut) |
| Move page-by-page | Anywhere | ++page-down++ | ++page-up++ | |
| Move block-by-block | Anywhere | ++alt+++++brace-right++ | ++alt+++++brace-left++ |  (Might not work on macOS due to conflict in keyboard shortcut).  A block (or paragraph) is defined as consucutive non-empty lines.  This is useful for instance to navigate method-by-method, provided you have blank lines between two methods |
| Next occurance of word | A word | | | Useful for looking for where a variable or method is defined/used |
| Matching bracket | A bracket | | | |
| Beginning/End of the file | Anywhere | ++ctrl+++++home++ | ++ctrl+++++end++ | Might not work on macOS.  Useful for jump to the end of the file (e.g., to append a new method) or to the beginning of the file (e.g., to add comments)

To jump to a particular line, ++ctrl+++++e++ to open the command bar, and issue the command `goto linenumber`.  For example, `goto 42` would jump to Line 42.

### Navigation Between Files

#### Multiple Buffers

Scenario: Suppose you are reading the code about `Simulator` and you find that it uses a class called `Event`.  You want to read the definition `Event.java`.  

You can use the command ++ctrl+++++e++ to open the command bar, and issue the command `open Event.java` to tell Micro that you want to edit the file named `Event.java` now.  

#### Multiple Windows

If you want to look at `Event.java` without closing `Simulator.java`, you can split the window.  Type ++ctrl+++++e++ to open the command bar and issue the command `hsplit Event.java` or `vsplit Event.java` to split the buffer (horizontally and vertically).

Use ++ctrl+++++w++ to navigate between windows.

#### Multiple Tabs

Or you can open the file in a new tab with ++ctrl+++++e++ `tab Event.java`.  Use ++ctrl+++++e++ `tabswitch` to navigate between tabs.

## Looking for Things

When reading code, we often need to look for a specific variable, method, or type.  For instance, you might wonder, what a method does, or which line sets a field to `null`.  In such scenarios, it is useful to ask Micro to search for it, rather than just scrolling through the code and eyeballing it yourself.

### Searching for a String in the Current File

To search for a string, type, ++ctrl+++++f++ followed by the string you are looking for.  The cursor will jump to the first occurrence of the string after the current cursor.  

You can use ++ctrl+++++n++ or ++ctrl+++++p++ to jump to the next or previous occurrence of the string respectively.

### Searching for a String Across Files

Not supported by micro.  Need to install additional plugin (such as [findinfolder](https://codeberg.org/micro-plugins/findinfolder).

## Moving Things Around

Often we need to move statements/blocks/methods/classes around, either to fix bugs or to tidy up our code.   This often involves two steps: (i) cutting/deleting what you want to move at the source, and (ii) pasting it to the destination.

### Swapping lines

Suppose we have two statements that are out of order.  For instance, we might write
```Java
i = 2 * j;
int j = 0;
```
which does not compile.  We should, of course, declare and initialize `j` first before using it.  Placing the cursor on the line `i = 2 * j`, we can move this line down with ++alt+++++arrow-down++ (or ++option+++++arrow-down++ on macOS)

### Reordering Multiple Lines

If you want to cut multiple lines, place the cursor at the beginning of the line you want to cut.  Press ++shift+++++arrow-down++ to select the lines you want to move.   Then ++alt+++++arrow-down++ or ++alt+++++arrow-up++ to move it to the destination.

Note that you cannot move the lines to a different file.  You can use the standard cut-and-paste keys ++ctrl+++++x++ ++ctrl+++++c++ for this purpose.

!!! Tip "Reformatting After Pasting"

    After pasting a block of code, the indentation of the pasted code might be inconsistent.  You can use ++tab++ or ++shift+++++tab++ to fix the indentation level of the selected text manually.

## Changing Names

### Changing the name of one type/variable/method call

Occasionally, we mix up our variable or our method name, and we need to fix it before the code runs correctly or compiles.  Suppose we have

```Java
double perimeter = circle.getArea();
```

and we realize that we should be calling `getPerimeter` instead. 

To change, (i) place the cursor at the beginning of `getArea`.  You can use the mouse or navigate word-by-word.   (ii) use ++shift+++++ctrl+++++arrow-right++ to select the word `getArea` and ++ctrl+++++x++ to cut.  Now type `getPerimeter` to replace the method name.

### Changing multiple names on the same line

Sometimes we have multiple occurrences that we wish to change on the same line.  Let's say:

```Java
Shape s = new Shape();
```

and we realize that we should be creating a `Circle` instead of a `Shape`.

You only have one option, which is to repeat the above twice.  

### Changing multiple occurrences in a block

Let's say that we copy the following method from a class `LeaveEvent.java` to `JoinEvent.java`:

```Java
  void updateTime(int now) {
      if (this.time > 1200) {
          this.time = now;
      } else {
          this.time = 1200;
      }
  }
```

and we realize that, in `JoinEvent` the corresponding field is called `joinTime` instead of just `time`.  Now we need to rename all occurrences of `time`` within this block to become `joinTime`.  

To do this, type ++ctrl+++++e++ and issue the command `replace time joinTime`.  This will replace all occurances of `time` with `joinTime`.  By default, it will prompt the users to confirm each replacement. 

Go through each `time` to replace one-by-one, and confirm the replacement of those that falls within the block.  

### Changing all occurrences in a file

Let's say that you have a type in the file `Rectangel.java`.  You have named your class `Rectangel` instead of `Rectangle`, and you want to fix all occurrences of this in the file.

The command `replace Rectangel Rectangle -a` to replace all occurances for you.

## Typing Long Java Names

It is a good habit to give meaningful names to the variables, methods, and types in our programs.  To avoid cryptic names such as `noc`, it is recommended that we use English words, such as `numOfCustomers`.  Such names can get very long.  Even if you are a master in naming and avoid such long names in your own code, you will inevitably use Java libraries with long names.  Having a long name has several disadvantages.  First, it takes more keystrokes to type.  Second, it increases the likelihood of typos. 

Here is a useful trick that can save you from typing long names.  Abbreviation is not supported in Micro.

### Auto-completion

You can type ++tab++ to auto-complete a word.  So you only need to type the long name the first time.  Subsequently, type the prefix and auto-complete.  

## Compiling without Leaving Micro

During development, we go through many iterations of the edit-compile-test cycles.  It would save time if we could do so without leaving Micro.  

### TERMINAL mode

It is often useful to split your Micro window to open up a terminal.  First split your window by ++ctrl+++++e++ `vsplit` or `hsplit`.  Then ++ctrl+++++e++ `term` to launch the terminal.  From the terminal, you can run `javac` to compile and `java` to test.  You can either ++ctrl+++++w++ to switch back to edit your code or ++ctrl+++++d++ to close the terminal.

### Invoking Shell Commands

You can use ++ctrl+++++b++ to run a shell command without the terminal.  So ++ctrl+++++b++ `javac *.java` would let you compile your code without even leaving Micro.
