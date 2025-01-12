# Unit 28: Immutability

!!! abstract "Learning Objectives"

    After this unit, students should:

    - be able to create an immutable class
    - understand the usefulness of making classes immutable

So far in this course, we have been focusing on three ways of dealing with software complexity: by encapsulating and hiding the complexity behind abstraction barriers, using a language with a strong type system and adhering to the subtyping substitution principle, and applying the abstraction principles and reusing code written as functions, classes, and generics types.

Another useful strategy to reduce bugs when code complexity increases is to _avoid_ change altogether.  This can be done by making our classes _immutable_. We create an instance of an immutable class, the instance _cannot have any visible changes outside its abstraction barrier_.  This means that every call of the instance's method must behave the same way throughout the lifetime of the instance.

There are many advantages of why we want to make our class immutable when possible.  To start, let's revisit a common bug due to aliasing.  Recall the following example from [Unit 9](09-composition.md),  where we create two circles `c1` and `c2` centered at the origin (0, 0).
```Java
Point p = new Point(0, 0);
Circle c1 = new Circle(p, 1);
Circle c2 = new Circle(p, 4);
```

Let's say that we have the `moveTo` method in both `Circle` and `Point`, to move the circle and point respectively.

```Java
class Point {
  private double x;
  private double y;
    :
  public void moveTo(double x, double y) {
    this.x = x;
    this.y = y;
  }
}

class Circle {
  private Point c;
  private double r;

  public Circle (Point c, double r) {
    this.c = c;
    this.r = r;
  }
    :

  public void moveTo(double x, double y) {
    c.moveTo(x, y);
  }
}
```

Suppose we want to move `c1` and only `c1` to be centered at (1,1).

```Java
c1.moveTo(1, 1);
```

The line of code above surprisingly moved the center of _both_ `c1` and `c2`, due to both circles `c1` and `c2` sharing the same point.  We have explored a solution below:

```Java
Point p1 = new Point(0, 0);
Circle c1 = new Circle(p1, 1);

Point p2 = new Point(0, 0);
Circle c2 = new Circle(p2, 4);

c1.moveTo(1, 1);
```

This approach avoids sharing references by creating copies of our points so that no two references point to the same instance, avoiding aliasing altogether.  This _partial_ fix, however, comes with extra costs in computational resources as the number of objects may proliferate.

This is also not a complete solution because surprisingly, we can move `c2` without calling `c2.moveTo(1, 1)` but by calling the code below.

```Java
p2.moveTo(1, 1);
```

Let's now see how immutability can help us resolve our problem.

## Immutable Points and Circles

Let's start by making our `Point` class immutable.  We start by making the fields `final` to signal our intention that we do not intend to _assign_ another value to them.  Now that the `x` and `y` cannot be re-assigned (a new value or even the same value), to move a point, we shouldn't re-assign to the fields `x` and `y` anymore.  Instead, we return a new `Point` instance to prevent mutating the current instance, as follows:

```Java
final class Point {
  private final double x;
  private final double y;

  public Point(double x, double y) {
    this.x = x;
    this.y = y;
  }

  public Point moveTo(double x, double y) {
    return new Point(x, y);
  }
    :

  @Override
  public String toString() {
    return "(" + this.x + "," + this.y + ")";
  }
}
```

Note that, to avoid (likely malicious or ignorant) subclasses of `Point` overriding the methods to make it appears that the point has mutated, it is recommended that we declare immutable classes as `final` to disallow inheritance.

Now, let's make `Circle` immutable:

```Java
final class Circle {
  private final Point c;
  private final double r;

  public Circle (Point c, double r) {
    this.c = c;
    this.r = r;
  }
    :

  public Circle moveTo(double x, double y) {
    return new Circle(c.moveTo(x, y), r);
  }
}
```

With both `Point` and `Circle` immutable, we can be sure that once an instance is created, it remains unchanged (outside the abstraction barrier):

```Java
Point p = new Point(0, 0);
Circle c1 = new Circle(p, 1);
Circle c2 = new Circle(p, 4);
c1.moveTo(1, 1); // c1 remains unchanged
```

To update the variable `c1`, we need to explicitly reassign it.

```Java
c1 = c1.moveTo(1, 1);
```

Now, `c1` moves to a new location, but `c2` remains unchanged.

Compare our new immutable approach to the two approaches above. The first shares all the references and is bug-prone.  The second creates a new copy of the instance every time and is resource-intensive.  Our third approach, using immutable classes, allows us to share all the references until we need to modify the instance, in which case we make a copy.  Such a _copy-on-write_ semantic allows us to avoid aliasing bugs without creating excessive copies of objects.

Note that the `final` keyword prevents assigning new values to the field.  Unfortunately, it does not prevent the field from being mutated.  So, to ensure that the classes we create are immutable, we have to ensure that the fields are themselves immutable.

## Advantages of Being Immutable

We have seen how making our classes immutable helps us remove the risk of potential bugs when we use composition and aliasing.  Immutability has other advantages as well.  

### Ease of Understanding

Code written with immutable objects is easier to reason with and easier to understand.  Suppose we create a `Circle` and assign it to a local variable:

```Java
Circle c = new Circle(new Point(0, 0), 8);
```

We pass `c` around to many other methods.  These other methods may invoke `c`'s methods; we may invoke `c`'s methods locally as well.  But, despite putting `c` through so much, unless we have explicitly re-assigned `c`, we can guarantee that `c` is still a circle centered at (0,0) with a radius of 8.  This immutable property makes it significantly easier to read, understand, and debug our code.

Without this property, we have to trace through all the methods that we pass `c` to, and each call of `c`'s methods to make sure that none of these codes modifies `c`.

### Enabling Safe Sharing of Objects

Making a class immutable allows us to safely share instances of the class, therefore reducing the need to create multiple copies of the same object.  For instance, the origin (0, 0) is commonly used.  If the instance is immutable, we can just create and cache a single copy of the origin, and always return this copy when the origin is required.

Let's modify our `Point` class so that it creates a single copy of the origin and returns the same copy every time the origin is required.

```Java
final class Point {
  private final double x;
  private final double y;
  
  private Point(double x, double y) {
    this.x = x;
    this.y = y;
  }

  private final static Point ORIGIN = new Point(0, 0);

  public static Point of(double x, double y) {
    if (x == 0 && y == 0) {
      return ORIGIN;
    }
    return new Point(x, y);
  }
    :
}
```

We made a few changes in the above:

- We made the constructor for `Point` private so that one cannot call the constructor directly.
- We provide a class factory method named `of` for the client to create a `Point` instance.  The `of` method returns the same instance `ORIGIN` every time `Point.of(0, 0)` is called.

Such a design pattern is only safe when the class is immutable.  Consider the mutable version of `Point` &mdash; calling `Point.of(0, 0).moveTo(1, 1)` would change every reference to the origin to (1, 1), causing chaos in the code!

### Enabling Safe Sharing of Internals

Immutable instances can also share their internals freely.  Consider an immutable implementation of our `Seq<T>`, called `ImmutableSeq<T>`.  Let's start with a simple version first.

```Java title="ImmutableSeq&lt;T&gt; v0.1"
final class ImmutableSeq<T> {
  private final T[] array;

  // Only items of type T goes into the array.
  @SafeVarargs
  public static <T> ImmutableSeq<T> of(T... items) {
    // We need to copy to ensure that it is truly immutable
    @SuppressWarnings("unchecked");
    T[] arr = (T[]) new Object[items.length];
    for (int i = 0; i < items.length; i++) {
      arr[i] = items[i];
    }
    return new ImmutableSeq<>(arr);
  }

  private ImmutableSeq(T[] a) {
    this.array = a;
  }

  public T get(int index) {
    return this.array[index];
  }
}
```

There are a few things to note here.

*Varargs* The parameter to the class factory method `of` has the form `T... items`.  The triple `.` notation is a Java syntax for a variable number of arguments of the same type (`T`).  Often called _varargs_, this is just syntactic sugar for passing in an array of items to a method.  The method is called _variadic method_.  We can then call `of` with a variable number of arguments, such as:

```Java
ImmutableSeq<Integer> a;
a = ImmutableSeq.of();
a = ImmutableSeq.of(1, 2, 3);
a = ImmutableSeq.of(1, 2, 3, 4, 5);
```

**@SafeVarargs.** &nbsp; Since the varargs is just an array, and array and generics do not mix well in Java, the compiler would throw us an unchecked warning.  In this instance, however, we know that our code is safe because we never put anything other than items of type `T` into the array.  We can use the `@SafeVarargs` annotation to tell the compiler that we know what we are doing and this varargs is safe.

Notice that we removed the `set` method and there is no other way an external client can modify the array once it is created.  This, of course, assumes that we will only be inserting an immutable object into our immutable array.  Unfortunately, this cannot be enforced by the compiler as the generic type `T` can be anything.

Now, suppose that we wish to support a `subarray` method, that returns a new array containing only a range of elements in the original array.  It behaves as follows:

```Java
ImmutableSeq<Integer> a = ImmutableSeq.of(10, 20, 30, 40, 50, 60);
ImmutableSeq<Integer> b = a.subarray(2, 4); // b is [30, 40, 50]
b.get(0) // returns 30
ImmutableSeq<Integer> c = b.subarray(1, 2); // c is [40, 50]
c.get(1) // returns 50
```

A typical way to implement `subarray` is to allocate a new `T[]` and copy the elements over.  This operation can be expensive if our `ImmutableSeq` has millions of elements.  But, since our class is immutable and the internal field `array` is guaranteed not to mutate, we can safely let `b` and `c` refer to the same `array` from `a`, and only store the starting and ending index.

```Java title="ImmutableSeq&lt;T&gt; v0.2 (with sharing)"
class ImmutableSeq<T> {
  private final int start;
  private final int end;
  private final T[] array;

  @SafeVarargs
  public static <T> ImmutableSeq<T> of(T... items) {
    // We need to copy to ensure that it is truly immutable
    @SuppressWarnings("unchecked");
    T[] arr = (T[]) new Object[items.length];
    for (int i = 0; i < items.length; i++) {
      arr[i] = items[i];
    }
    return new ImmutableSeq<>(arr, 0, items.length - 1);
  }

  private ImmutableSeq(T[] a, int start, int end) {
    this.start = start;
    this.end = end;
    this.array = a;
  }

  public T get(int index) {
    if (index < this.start || this.start + index > this.end) {
      throw new IllegalArgumentException("Index out of bound");
    }
    return this.array[this.start + index];
  }

  public ImmutableSeq<T> subarray(int start, int end) {
     return new ImmutableSeq<>(this.array, this.start + start, this.start + end);
  }
}
```

### Enabling Safe Concurrent Execution

We will explore concurrent execution of code towards the end of the module, but making our classes immutable goes a long way in reducing bugs related to concurrent execution.  Without going into details here (you will learn the details later), concurrent programming allows multiple threads of code to run in an interleaved fashion, in an arbitrary interleaving order.   If we have complex code that is difficult to debug to begin with, imagine having code where we have to ensure its correctness regardless of how the execution interleaves!  Immutability helps us ensure that regardless of how the code interleaves, our objects remain unchanged.

## Final &ne; Immutable

When creating an immutable class, we need to be careful to distinguish between the keywords that help us avoid accidentally making things easily mutable and the actual concept of an immutable class.  For instance, it is _insufficient_ to simply declare all fields with `final` keywords.  Just because we cannot accidentally update the field, does not mean that the field is immutable.  Consider the same `Circle` above but with a getter for the center point and now imagine that the `Point` is mutable.

```java
final class Circle {
  private final Point c;
  private final double r;

  public Circle (Point c, double r) {
    this.c = c;
    this.r = r;
  }
    :
    
  public Point getCenter() {
    return this.c;
  }

  public Circle moveTo(double x, double y) {
    return new Circle(c.moveTo(x, y), r);
  }
}
```

We can then simply retrieve the center point and mutate it externally.

```java
Circle c = new Circle(new Point(0, 0), 1);
c.getCenter().moveTo(1, 1); // assume mutable Point
```

On the other hand, it is not even _necessary_ to use the `final` keyword to make an immutable class.  We simply have to have a class that prevents any and all kinds of sharing by copying all the parameters before assigning them to the fields and copying all return values.  Assume that all classes have a correctly implemented `clone()` method.  Then the following `Circle` is immutable even with a getter and no `final` keyword on the fields.  We still need the `final` keyword on the class to disallow inheritance.

```java
final class Circle {
  private Point c;
  private double r;

  public Circle (Point c, double r) {
    this.c = c.clone();
    this.r = r; // primitive, no need cloning
  }
    :
    
  public Point getCenter() {
    return this.c.clone();
  }

  public Circle moveTo(double x, double y) {
    return new Circle(c.moveTo(x, y), r);
  }
}
```

That is not to say that the `final` keyword is not important.  It helps accidental re-assignment and in some cases, that is sufficient especially if the fields are of primitive type.  Once we have created one immutable class, we can then create other larger immutable classes by only using immutable classes as fields.
