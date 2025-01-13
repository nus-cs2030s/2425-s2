# Javadoc

## Why is documentation important

One of the goals of CS2030S is to move you away from the mindset that you are writing code that you will discard after it is done (_e.g., in CS1101S labs_) and you are writing code that no one else will read except you.  CS2030S prepares you to work in software engineering teams in many ways, and one of the ways is to get you to document your code.

`javadoc` is a tool used to document Java code.  It automatically generates HTML documentation from the comments in your code.  The [Java API](https://docs.oracle.com/en/java/javase/21/docs/api/index.html) that you have seen are generated from `javadoc`.

## How to comment for javadoc

`javadoc` distinguishes between normal comments and comments meant for `javadoc` by how we "fence" the comments.  A `javadoc` comment always starts with `/**` (_note the double asterisks_) and ends with `*/` and is always placed _immediately_ before a class, an interface, a constructor, a method, or field declaration.

Example:
```Java
/**
 * Encapsulates a circle on a 2D plane.  The operators supported 
 * includes (i) checking if a point is contained in the circle,
 * and (ii) moving the circle to a new position.
 */
```

The first sentence is the summary sentence.  We should follow some style guidelines when writing the summary sentence (_see below_).

`javadoc` comments supports HTML tags.  If you are not familiar with HTML,
that is fine.  We will tell you what you need to know below.

## Tags

`javadoc` supports tags.  Below are some tags that we would like you to use.  We use curly bracket (_e.g., `{name}`_) to indicate information that need to be filled in by you.

- `@param {name} {description}`: describe the parameter `{name}`
- `@param <{name}> {description}`: describe the type parameter `{name}`
- `@return {description}` describe the return value
- `@throws {class name} {description}` describe what the exception `{class name}` being thrown and what are the possible reasons

!!! info "Example"

    ```Java
    /** 
     * Generate the content of the list.
     *
     * @param <T> The type of the elements in the list.
     * @param n The number of elements.
     * @param seed The first element.
     * @param f The transformation function on the elements.
     * @return The created list.
     */
    public static <T> EagerList<T> generate(int n, T seed, Transformer<T, T> f) {
      EagerList<T> eagerList = new EagerList<>(new ArrayList<>());
      T curr = seed;
      for (int i = 0; i < n; i++) {
        eagerList.list.add(curr);
        curr = f.transform(curr);
      }
      return eagerList;
    }
    ```
    
    Note how the `@param` are ordered.

## Style

1. If you want to break your comments into paragraphs, insert one blank line between paragraphs.  Start a new paragraph with HTML tag `<p>` with no space after, and end your paragraph with HTML tag `</p>`.

2. You should use the tags `@param` `@return` and `@throws` in that order, and they should never appear without a description.

    - The order of `@param` should follow how the parameters (_including type parameters_) appear in your method.

3. The summary should be short and succinct.  It may not be a complete sentence, but it should still be capitalized and ends with a period.  E.g., ```/** Encapsulates a circle on 2D plane. .. */```

4. You don't need to write `javadoc` for self-explanatory, simple, obvious, methods.  e.g., `getX()`, unless you want to explain what `x` means.  

## How to generate javadoc

In its simplest form, you can generate `javadoc` like this:

```
javadoc *.java
```

This will generate the HTML files in your current directory.  

To avoid clutters, I recommend that you specify the output directory, e.g.,

```
javadoc *.java -d docs
```

This will generate the documentation and put it under the `docs` subdirectory.

`javadoc` by default generates documents only for public classes, fields, and methods.  To generate documentation for everything, run

```
javadoc *.java -d docs -private
```

If you generate the documentation on your computer, you can view it by opening up the file `index.html` in your browser.

## See Also

- [Oracle's `javadoc` guide](https://docs.oracle.com/en/java/javase/21/javadoc/javadoc.html)
