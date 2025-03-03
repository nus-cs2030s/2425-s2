# Unit 26: Wildcards

!!! abstract "Learning Objectives"

    After going through this unit, students should:

    - be aware of the meaning of wildcard `?` and bounded wildcards
    - know how to use wildcards to write methods that are more flexible in accepting a range of types
    - know that upper-bounded wildcard is covariant and lower-bounded wildcard is contravariant
    - know the PECS principle and how to apply it
    - be aware that the unbounded wildcard allows us to not use raw types in our programs

## `contains` with `Seq<T>`

Now that we have our `Seq<T>` class, let's modify our generic `contains` method and replace the type of the argument `T[]` with `Seq<T>`.

```Java title="contains v0.5 (with Seq&lt;T&gt;)"
class A {
  public static <T> boolean contains(Seq<T> seq, T obj) {
    for (int i = 0; i < seq.getLength(); i++) {
      T curr = seq.get(i);
      if (curr.equals(obj)) {
        return true;
      }
    }
    return false;
  }
}
```

Similar to the version that takes in `T[]`, using generics allows us to constrain the type of the elements of the sequence and the object to search for to be the same.  This allows the following code to type-check correctly:
```Java
Seq<String> stringSeq;
Seq<Circle> circleSeq;
Circle circle;
 :
A.<String>contains(stringSeq, "hello"); // ok
A.<Circle>contains(circleSeq, circle); // ok
```

But trying to search for a circle in an sequence of strings would lead to a type error:
```Java
A.<String>contains(stringSeq, circle); // error
```

Consider now having an sequence of shapes.
```Java
Seq<Shape> shapeSeq;
Seq<Circle> circleSeq;
Shape shape;
Circle circle;
 :
A.<Shape>contains(shapeSeq, shape); // ok
A.<Circle>contains(circleSeq, circle); // ok
```

As expected, we can pass `Shape` as the argument for `T`, and search for a `Shape` in an instance of `Seq<Shape>`. Similarly, we can pass `Circle` as the argument for `T` and search for a `Circle` in an instance of `Seq<Circle>`.

We could also look for a `Circle` instance from `Seq<Shape>` if we pass `Shape` as the argument for `T`.
```Java
A.<Shape>contains(shapeSeq, circle); // ok
```

Note that we can pass in a `Circle` instance as a `Shape`, since `Circle` <: `Shape`.

Generics are invariant in Java, i.e, there is no subtyping relationship between `Seq<Shape>` and `Seq<Circle>`.  `Seq<Circle>` is not a subtype of `Seq<Shape>`.  Otherwise, it would violate the Liskov Substitution Principle, we can put a square into a `Seq<Shape>` instance, but we can't put a square into a `Seq<Circle>` instance.

So, we can't call:
```Java
A.<Circle>contains(shapeSeq, circle); // compilation error
```

The following would result in compilation errors as well:
```Java
A.<Shape>contains(circleSeq, shape); // compilation error
A.<Circle>contains(circleSeq, shape); // compilation error
```

Thus, with our current implementation, we can't look for a shape (which may be a circle) in a sequence of circles, even though this is something reasonable that a programmer might want to do.  This constraint is due to the invariance of generics &mdash; while we avoided the possibility of run-time errors by avoiding the covariance of arrays, our methods have become less general.

Let's see how we can fix this with bounded type parameters first.  We can introduce another type parameter, say `S`, to remove the constraints that the type of the sequence must be the same as the type of the object to search for,  i.e., we change from
```Java
  public static <T> boolean contains(Seq<T> seq, T obj) { .. }
```

to:
```Java
  public static <S,T> boolean contains(Seq<T> seq, S obj) { .. }
```

But we don't want to completely decouple `T` and `S`, as we want `T` to be a subtype of `S`.  We can thus make `T` a bounded type parameter, and write:
```Java
  public static <S, T extends S> boolean contains(Seq<T> seq, S obj) { .. }
```

Now, we can search for a shape in a sequence of circles.
```Java
A.<Shape,Circle>contains(circleSeq, shape);
```

## Copying to and from `Seq<T>`

Let's consider another example.  Let's add two methods `copyFrom` and `copyTo`, to `Seq<T>` so that we can copy to and from one sequence to another.

```Java title="Seq&lt;T&gt; v0.4 (with copy)"
class Seq<T> {
  private T[] array;

  public Seq(int size) {
  // The only way we can put an object into the array is through
  // the method set() and we only put an object of type T inside.
  // So it is safe to cast `Object[]` to `T[]`.
  @SuppressWarnings("unchecked")
    T[] a = (T[]) new Object[size];
    this.array = a;
  }

  public void set(int index, T item) {
    this.array[index] = item;
  }

  public T get(int index) {
    return this.array[index];
  }

  public void copyFrom(Seq<T> src) {
    int len = Math.min(this.array.length, src.array.length);
    for (int i = 0; i < len; i++) {
        this.set(i, src.get(i));
    }
  }

  public void copyTo(Seq<T> dest) {
    int len = Math.min(this.array.length, dest.array.length);
    for (int i = 0; i < len; i++) {
        dest.set(i, this.get(i));
    }
  }
}
```

With this implementation, we can copy, say, a `Seq<Circle>` to another `Seq<Circle>`, a `Seq<Shape>` to another `Seq<Shape>`, but not a `Seq<Circle>` into a `Seq<Shape>`, even though each circle is a shape!

```Java
Seq<Circle> circleSeq;
Seq<Shape> shapeSeq;
  :
shapeSeq.copyFrom(circleSeq); // error
circleSeq.copyTo(shapeSeq); // error
```

## Upper-Bounded Wildcards

Let's consider the method `copyFrom`.  We should be able to copy from a sequence of shapes, a sequence of circles, a sequence of squares, etc, into a sequence of shapes.  In other words, we should be able to copy from _a sequence of any subtype of shapes_ into a sequence of shapes.  Is there such a type in Java?

The type that we are looking for is `Seq<? extends Shape>`.  This generic type uses the _wildcard_ `?`.  Just like a wildcard in card games, it is a substitute for any type.   A wildcard can be bounded.  Here, this wildcard is upper-bounded by `Shape`, i.e., it can be substituted with either `Shape` or any subtype of `Shape`.

The upper-bounded wildcard is an example of covariance. The upper-bounded wildcard has the following subtyping relations:

- If `S` <: `T`, then `A<? extends S>` <: `A<? extends T>` (covariance)
- For any type `S`, `A<S>` <: `A<? extends S>`

For instance, we have:

- `Seq<Circle>` <: `Seq<? extends Circle>`
- Since `Circle` <: `Shape`, `Seq<? extends Circle>` <: `Seq<? extends Shape>`
- Since subtyping is transitive, we have `Seq<Circle>` <: `Seq<? extends Shape>`

Because `Seq<Circle>` <: `Seq<? extends Shape>`, if we change the type of the parameter of `copyFrom` to `Seq<? extends T>`, 
```Java
  public void copyFrom(Seq<? extends T> src) {
    int len = Math.min(this.array.length, src.array.length);
    for (int i = 0; i < len; i++) {
        this.set(i, src.get(i));
    }
  }
```

We can now call:
```Java
shapeSeq.copyFrom(circleSeq); // ok
```

without error.

## Lower-Bounded Wildcards

Let's now try to allow copying of a `Seq<Circle>` to `Seq<Shape>`.
```Java
circleSeq.copyTo(shapeSeq); 
```

by doing the same thing:
```Java
  public void copyTo(Seq<? extends T> dest) {
    int len = Math.min(this.array.length, dest.array.length);
    for (int i = 0; i < len; i++) {
        dest.set(i, this.get(i));
    }
  }
```

The code above would not compile.  We will get the following somewhat cryptic message when we compile with the `-Xdiags:verbose` flag:
```
Seq.java:32: error: method set in class Seq<T> cannot be applied to given types;
        dest.set(i, this.get(i));
          ^
  required: int,CAP#1
  found: int,T
  reason: argument mismatch; T cannot be converted to CAP#1
  where T is a type-variable:
    T extends Object declared in class Seq
  where CAP#1 is a fresh type-variable:
    CAP#1 extends T from capture of ? extends T
1 error
```

Let's try not to understand what the error message means first, and think about what could go wrong if the compiler allows:
```Java
        dest.set(i, this.get(i));
```

Here, we are trying to put an instance with compile-time type `T` into a sequence that contains elements with the compile-time type of `T` or subtype of `T`.  

The `copyTo` method of `Seq<Shape>` would allow a `Seq<Circle>` as an argument, and we would end up putting instance with compile-time type `Shape` into `Seq<Circle>`.  If all the shapes are circles, we are fine, but there might be other shapes (rectangles, squares) in `this` instance of `Seq<Shape>`, and we can't fit them into `Seq<Circle>`!  Thus, the line 
```Java
        dest.set(i, this.get(i));
```

is not type-safe and could lead to `ClassCastException` during run-time.  

Where can we copy our shapes into?  We can only copy them safely into a `Seq<Shape>`, `Seq<Object>`, `Seq<GetAreable>`, for instance.  In other words, into sequences containing `Shape` or supertype of `Shape`.  

We need a wildcard lower-bounded by `Shape`, and Java's syntax for this is `? super Shape`.  Using this new notation, we can replace the type for `dest` with:

```Java
  public void copyTo(Seq<? super T> dest) {
    int len = Math.min(this.array.length, dest.array.length);
    for (int i = 0; i < len; i++) {
        dest.set(i, this.get(i));
    }
  }
```

The code would now type-check and compile.

The lower-bounded wildcard is an example of contravariance.  We have the following subtyping relations:

- If `S` <: `T`, then `A<? super T>` <: `A<? super S>` (contravariance)
- For any type `S`, `A<S>` <: `A<? super S>`

For instance, we have:

- `Seq<Shape>` <: `Seq<? super Shape>`
- Since `Circle` <: `Shape`, `Seq<? super Shape>` <: `Seq<? super Circle>`
- Since subtyping is transitive, we have `Seq<Shape>` <: `Seq<? super Circle>`

The line of code below now compiles:
```Java
circleSeq.copyTo(shapeSeq); 
```

Our new `Seq<T>` is now
```Java title="Seq&lt;T&gt; v0.5 (with flexible copy using wildcards)"
class Seq<T> {
  private T[] array;

  public Seq(int size) {
  // The only way we can put an object into the array is through
  // the method set() and we only put an object of type T inside.
  // So it is safe to cast `Object[]` to `T[]`.
  @SuppressWarnings("unchecked")
    T[] a = (T[]) new Object[size];
  this.array = a;
  }

  public void set(int index, T item) {
    this.array[index] = item;
  }

  public T get(int index) {
    return this.array[index];
  }

  public void copyFrom(Seq<? extends T> src) {
    int len = Math.min(this.array.length, src.array.length);
    for (int i = 0; i < len; i++) {
        this.set(i, src.get(i));
    }
  }

  public void copyTo(Seq<? super T> dest) {
    int len = Math.min(this.array.length, dest.array.length);
    for (int i = 0; i < len; i++) {
        dest.set(i, this.get(i));
    }
  }
}
```


## PECS

Now we will introduce the rule that governs when we should use the upper-bounded wildcard `? extends T` or the lower-bounded wildcard `? super T`.  This choice depends on the role of the variable in our program.   If the variable is a _producer_ that returns a variable of type `T`, it should be declared with the wildcard `? extends T`.  Otherwise, if it is a _consumer_ that accepts a variable of type `T`, it should be declared with the wildcard `? super T`.

As an example, the variable `src` in `copyFrom` above acts as a _producer_.  It produces a variable of type `T`.  The type parameter for `src` must be either `T` or a subtype of `T` to ensure type safety.  So the type for `src` is `Seq<? extends T>`.    

On the other hand, the variable `dest` in `copyTo` above acts as a _consumer_.  It consumes a variable of type `T`.  The type parameter of `dest` must be either `T` or supertype of `T` for it to be type-safe.  As such, the type for `dest` is `Seq<? super T>`.  

This rule can be remembered with the mnemonic PECS, or "Producer Extends; Consumer Super".

## Unbounded Wildcards

It is also possible to have unbounded wildcards, such as `Seq<?>`.  `Seq<?>` is the supertype of every parameterized type of `Seq<T>`.  Recall that `Object` is the supertype of all reference types.  When we want to write a method that takes in a reference type, but we want the method to be flexible enough, we can make the method accept a parameter of type `Object`.  Similarly, `Seq<?>` is useful when you want to write a method that takes in a sequence of some specific type, and you want the method to be flexible enough to take in a sequence of any type.  For instance, if we have:
 
```Java
void foo(Seq<?> seq) {
}
```

We could call it with:
```Java
Seq<Circle> ac;
Seq<String> as;
foo(ac); // ok
foo(as); // ok
```

A method that takes in generic type with an unbounded wildcard is actually pretty restrictive.  Consider the following:
```Java
void foo(Seq<?> seq) {
   :
  x = seq.get(0);
  seq.set(0, y);

}
```

What should the type of the returned element `x` be?  Since `Seq<?>` is the supertype of all possible `Seq<T>`, the method `foo` can receive an instance of `Seq<Circle>`, `Seq<String>`, etc. as an argument.  The only safe choice for the type of `x` is `Object`.

The type for `y` is even more restrictive.  Since there are many possibilities of what type of sequence it is receiving, we can only put `null` into `seq`! 

There is an important distinction to be made between `Seq`, `Seq<?>` and `Seq<Object>`.  Whilst `Object` is the supertype of all `T`, it does not follow that `Seq<Object>` is the supertype of all `Seq<T>` due to generics being invariant. Therefore, the following statements will fail to compile:

```Java
Seq<Object> a1 = new Seq<String>(0); 
Seq<Object> a2 = new Seq<Integer>(0);
```

Whereas the following statements will compile:

```Java
Seq<?> a1 = new Seq<String>(0); // Does compile
Seq<?> a2 = new Seq<Integer>(0); // Does compile
```

If we have a function
```Java
void bar(Seq<Object> seq) {
}
```

Then, the method `bar` is restricted to _only_ take in a `Seq<Object>` instance as argument.
```Java
Seq<Circle> ac;
Seq<String> as;
bar(ac); // compilation error
bar(as); // compilation error
```

What about raw types?  Suppose we write the method below that accepts a raw type
```Java
void qux(Seq seq) {
}
```

Then, the method `qux` is also flexible enough to take in any `Seq<T>` as argument.
```Java
Seq<Circle> ac;
Seq<String> as;
qux(ac); 
qux(as); 
```

Unlike `Seq<?>`, however, the compiler does not have the information about the type of the component of the sequence, and cannot type check for us.  It is up to the programmer to ensure type safety.  For this reason, we must not use raw types.

Intuitively, we can think of `Seq<?>`, `Seq<Object>`, and `Seq` as follows:

- `Seq<?>` is a sequence of objects of some specific, but unknown type;
- `Seq<Object>` is a sequence of `Object` instances, with type checking by the compiler;
- `Seq` is a sequence of `Object` instances, without type checking.

## Back to `contains`

Now, let's simplify our `contains` methods with the help of wildcards.  Recall that to add flexibility into the method parameter and allow us to search for a shape in a sequence of circles, we have modified our method into the following:

```Java title="contains v0.6 (with Seq&lt;T&gt;)"
class A { 
  public static <S,T extends S> boolean contains(Seq<T> seq, S obj) {
    for (int i = 0; i < seq.getLength(); i++) {
      T curr = seq.get(i);
      if (curr.equals(obj)) {
        return true;
      }
    }
    return false;
  }
}
```

Can we make this simpler using wildcards?  Since we want to search for an object of type `S` in a sequence of its subtype, we can remove the second parameter type `T` and change the type of `seq` to `Seq<? extends S>`:

```Java title="contains v0.7 (with wild cards)"
class A {
  public static <S> boolean contains(Seq<? extends S> seq, S obj) {
    for (int i = 0; i < seq.getLength(); i++) {
      S curr = seq.get(i);
      if (curr.equals(obj)) {
        return true;
      }
    }
    return false;
  }
}
```

We can double-check that `seq` is a producer (it produces `curr` on Line 5) and this follows the PECS rules.
Now, we can search for a shape in a sequence of circles.
```Java
A.<Shape>contains(circleSeq, shape);
```

## Revisiting Raw Types

In previous units, we said that you may use raw types only in two scenarios. Namely, when using generics and `instanceof` together, and when creating arrays. However, with unbounded wildcards, we can now see it is possible to remove both of these exceptions. We can now use `instanceof` in the following way:

```Java
a instanceof A<?> 
```

Recall that in the example above, `instanceof` checks of the run-time type of `a`.  Previously, we said that we can't check for, say,
```Java
a instanceof A<String> 
```

since the type argument `String` is not available during run-time due to erasure.  Using `<?>` fits the purpose here because it explicitly communicates to the reader of the code that we are checking that `a` is an instance of `A` with some unknown (erased) type parameter.

Similarly, we can create arrays in the following way:
```Java
new Comparable<?>[10];
```

Previously, we said that we could not create an array using the expression `new Comparable<String>[10]` because generics and arrays do not mix well.  Java insists that the array creation expression uses a _reifiable_ type, i.e., a type where no type information is lost during compilation.  Unlike `Comparable<String>`, however, `Comparable<?>` is reifiable.  Since we don't know what is the type of `?`, no type information is lost during erasure!

Going forward now in the module, we will not permit the use of raw types in any scenario.
