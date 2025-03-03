# CS2030/S Java Style Guide

## Why Coding Style is Important

One of the goals of CS2030/S is to move you away from the mindset that you are writing code that you will discard after it is done (_e.g., in CS1101S missions_) and you are writing code that no one else will read except you and your tutor.  CS2030/S prepares you to work in a software engineering team in many ways. One of the ways is to enforce a consistent coding style.

If everyone on the team follows the same style, the intent of the programmer can become clear (_e.g., is this a class or a field?_), the code is more readable and less bug-prone (_e.g._, see the [Apple `goto fail` bug](https://www.wired.com/2014/02/gotofail/) for an example of buggy program due to style_).  Empirical studies support this:

!!! quote
    "It is not merely a matter of aesthetics that programs should be written in a particular style. Rather there is a psychological basis for writing programs in a conventional manner: programmers have strong expectations that other programmers will follow these discourse rules. If the rules are violated, then the utility afforded by the expectations that programmers have built up over time is effectively nullified. The results from the experiments with novice and advanced student programmers and with professional programmers described in this paper provide clear support for these claims."

    Elliot Soloway and Kate Ehrlich. "Empirical studies of programming knowledge." IEEE Transactions on Software Engineering 5 (1984): 595-609.

Many major companies enforce coding styles, and some have published them.  For CS2030, we base our (_simplified_) coding style on [Google's Java Coding Style](https://google.github.io/styleguide/javaguide.html).  You should bookmark the link because you need to come back to it again and again.

## Spacing and Indentation

1. No tabs.  Use only whitespace.

    !!! info "VIM Setting"
        For `vim` users, the following setting in your `~/.vimrc` file:

        ```
        set expandtab
        ```

        causes ++tab++ to be expanded to whitespace.

    !!! note "For CS2030S"

        This option is already included in the `~/.vimrc` file if you follow the [Vim setup guide](vim/setup.md). In fact, we recommend you follow the [Vim setup guide](vim/setup.md) instead and don't manually manage your own version of your `~/.vimrc` file.

        Most other source code editors have similar configurations.

1. Block indentation is exactly two spaces.

    ```Java
    if (x == 0) {
        x++;
        for (i = 0; i < x; i++) {
            x += i;
        }
    }
    ```

    !!! info "VIM Setting"
        For `vim` users, in `~/.vimrc`, add the following:

        ```
        set tabstop=2
        set shiftwidth=2
        set autoindent
        set smartindent
        " For Java: enabling this includes Java-specific indentation settings that handle annotations like @Override
        filetype plugin indent on
        ```

        To help you with indentation.


    !!! note "For CS2030S"

        These options are already included in the `~/.vimrc` file if you follow the [Vim setup guide](vim/setup.md). In fact, we recommend you follow the [Vim setup guide](vim/setup.md) instead and don't manually manage your own version of your `~/.vimrc` file.

        Most other source code editors have similar configurations.

1. Each line is limited to 100 characters in length.  
    line into multiple lines to enhance readability, this is called _line wrapping_.  When you do so, each continuation line is indented at least 4 spaces from the original line.

    !!! success "Good Example"

        ```Java
        void foo(double a, double b, double c, double d
            double e, double f) {
          if ((a > b) && (b > c) && (c > d) && (d > e) &&
              (e > f)) {
          }
        }
        ```

    !!! failure "Bad Example"

        ```Java
        void foo(double a, double b, double c, double d
          double e, double f) {
            if ((a > b) && (b > c) && (c > d) && (d > e) &&
              (e > f)) {
            }
        }
        ```

        ```Java
        void foo(double a, double b, double c, double d
        double e, double f) {
            if ((a > b) && (b > c) && (c > d) && (d > e) &&
            (e > f)) {
            }
        }
        ```

1. Indent comments at the same level as the surrounding code.  For multiple comments, align `*` with the previous line.

    !!! success "Good Example"

        ```Java
        /*
         * Good style
         */
        ```

        ```Java
        /**
         * Good style for JavaDoc
         */
        ```

    !!! failure "Bad Example"

        ```Java
        /*
        * Not a good style
        */
        ```

        ```Java
        /**
        * Not a good style for JavaDoc
        */
        ```

        ```Java
        /**
          * Also not a good style for JavaDoc
          */
        ```


3. White space should separate Java keywords from parenthesis and braces, and be added on both sides of binary operators (_`+`, `-`, `/`, etc_) as well as `:` in enhanced for-loop.  Space should also appear before and after `//` comments

    !!! success "Good Example"

        ```Java
        if (x == 0) {
            x++; // to make sure x is at least one.
            for (i = 0; i < x; i++) {
                x += i;
            }
        }
        ```

    !!! failure "Bad Example"

        ```Java
        if(x==0){
            x++;//to make sure x is at least one.
            for(i=0;i<x;i++){
            x+=i;
            }
        }
            ```


## Classes

1. Each file contains exactly one top-level (_i.e., non-nested_) class.

2. Each top-level class resides in a source file of its own.

3. When a class has overladed methods (_e.g., multiple constructors or methods of the same name_), they appear sequentially with no other code in between.

## Braces

1. Braces are always used (_even if the body is empty or contains a single statement_)

2. Use "[Egyptian brackets](https://en.wikipedia.org/wiki/Indentation_style#K&R_style)":

    - Opening brace has no line break before; but has a line break after
    - Closing brace has a line break before; and has a line break after (_except when there is `else` or comma following a closing brace_).

    !!! success "Good Example"
        ```Java
        if (x == 0) {
            x++;
        }
        ```

    !!! failure "Bad Example"
        ```Java
        if (x == 0) { x++; }
        ```
        ```Java
        if (x == 0) // Allman style (do not use)
        {
            x++;
        }
        ```
        ```Java
        if (x == 0) // Pico style (do not use)
        {
            x++; }
        ```

## Lines

1. Exactly one blank line after `import` statements.

1. Each statement is followed by a line break, no matter how short the statement is.

    !!! success "Good Example"

        ```Java
        x++;
        i++;
        ```

    !!! failure "Bad Example"

        ```Java
        x++; i++;
        ```

1. There should be a blank line between constructors, methods, nested classes and static initializers.  Blank lines can be used between fields to create logical groupings.

## Identifies

1. One variable per declaration.

    !!! success "Good Example"

        ```Java
        int x;
        int y;
        ```

    !!! failure "Bad Example"

        ```Java
        int x, y;
        ```

1. No C-style array declaration

    !!! success "Good Example"

        ```Java
        String[] args;
        ```

    !!! failure "Bad Example"

        ```Java
        String args[];
        ```

1. Class modifiers appear in the following order:

    ```Java
    public protected private abstract default static final transient volatile synchronized native strictfp
    ```

    !!! success "Good Example"

        ```Java
        public static void main(String[] args)
        ```

    !!! failure "Bad Example"

        ```Java
        static public void main(String[] args)
        ```

1. Class names are written in UpperCamelCase; method names and field names in lowerCamelCase; and constant names in ALL_CAPS_SNAKE_CASE.  Type parameters in single capital letters.

1. Static fields and methods must be accessed with their corresponding class names.

## Statements and Annotations

1. Switch statements always include a `default` case.

1. One annotation per line.

1. Always use `@Override`.

    ```Java
    @Override
    public boolean equals(Object o) {
        :
    }
    ```

1. Caught exceptions should not be ignored.

1. Avoid `import` using wildcards `*`.  Always import the specific class you need.
    !!! success "Good Example"

        ```Java
        import java.util.ArrayList;
        import java.util.List;
        ```

    !!! failure "Bad Example"

        ```Java
        import java.util.*;
        ```

1. Import statement should be in alphabetical order.
    !!! success "Good Example"

        ```Java
        import java.util.ArrayList;
        import java.util.List;
        ```

    !!! failure "Bad Example"

        ```Java
        import java.util.List;
        import java.util.ArrayList;
        ```

## Using `checkstyle`

To automatically check for style violations, we use a tool called [`checkstyle`](http://checkstyle.org).

Example of how to run:

```
java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/checkstyle.xml *.java
```

The exercises and exams may have different stylecheck configurations.  See the corresponding instructions in the exercises/exam papers.

Hint: put the command into a `bash` script so that you do not need to type such a long string all the time.

## Using `google-java-format`

To automatically formar your code, we use a tool called [`google-java-format`](`https://github.com/google/google-java-format`)

We will automatically format your code using this tool when you submit your code.  As such, what you submit may be look different from the version of code that you have written.
