# Unit 14: Polymorphism

!!! abstract "Learning Objectives"

    After reading this unit, students should

    - understand polymorphism
    - be aware of dynamic binding
    - be aware of the `equals` method and the need to override it to customize the equality test
    - understand when narrowing type conversion and type casting are allowed

## Taking on Many Forms

Method overriding enables _polymorphism_, the fourth and the last pillar of OOP, and arguably the most powerful one.  It allows us to change how existing code behaves, without changing a single line of the existing code (or even having access to the code).

Consider the function `say(Object)` below:
```Java
void say(Object obj) {
  System.out.println("Hi, I am " + obj.toString());
}
```

Note that this method receives an `Object` instance.  Since both `Point` <: `Object` and `Circle` <: `Object`, we can do the following:
```Java
Point p = new Point(0, 0);
say(p);
Circle c = new Circle(p, 4);
say(c);
```

When executed, `say` will first print `Hi, I am (0.0, 0.0)`, followed by `Hi, I am { center: (0.0, 0.0), radius: 4.0 }`.  _We are invoking the overriding `Point::toString()` in the first call, and `Circle::toString()` in the second call_.  The same method invocation `obj.toString()` causes two different methods to be called in two separate invocations!

In biology, polymorphism means that an organism can have many different forms.  Here, the variable `obj` can have many forms as well.  Which method is invoked is decided _during run-time_, depending on the run-time type of the `obj`.  This is called _dynamic binding_ or _late binding_ or _dynamic dispatch_.

Before we get into this in more detail, let's consider overriding `Object::equals(Object)`.

## The `equals` method

`Object::equals(Object)` compares if two object references refer to the same object.  Suppose we have:

```Java
Circle c0 = new Circle(new Point(0, 0), 10);
Circle c1 = new Circle(new Point(0, 0), 10);
Circle c2 = c1;
```

`c2.equals(c1)` returns `true`, but `c0.equals(c1)` returns `false`.  Even though `c0` and `c1` are _semantically_ the same, they refer to two different objects.

To compare if two circles are _semantically_ the same, we need to override this method[^1].  After all, Java does not know what it means for two circles to be equal, so we have to define it.

[^1]: If we override `equals()`, we should generally override `hashCode()` as well, but let's leave that for another lesson on another day.

```Java title="Circle v0.7a with Overriding equals" hl_lines="41-51"
import java.lang.Math;

/**
 * A Circle object encapsulates a circle on a 2D plane.
 */
class Circle {
  private Point c;   // the center
  private double r;  // the length of the radius

  /**
   * Create a circle centered on Point c with given radius r
   */
  public Circle(Point c, double r) {
    this.c = c;
    this.r = r;
  }

  /**
   * Return the area of the circle.
   */
  public double getArea() {
    return Math.PI * this.r * this.r;
  }

  /**
   * Return true if the given point p is within the circle.
   */
  public boolean contains(Point p) {
    return false;
    // TODO: Left as an exercise
  }

  /**
   * Return the string representation of this circle.
   */
  @Override
  public String toString() {
    return "{ center: " + this.c + ", radius: " + this.r + " }";
  }

  /**
   * Return true the object is the same circle (i.e., same center, same radius).
   */
  @Override
  public boolean equals(Object obj) {
    if (obj instanceof Circle) {
      Circle circle = (Circle) obj;
      return (circle.c.equals(this.c) && circle.r == this.r);
    }
    return false;
  }
}
```

This is more complicated than `toString`.  There are a few new concepts involved here:

- `equals` takes in a parameter of compile-time type `Object`.  It only makes sense if we compare (during run-time) a circle with another circle.  So, we first check if the run-time type of `obj` is a subtype of `Circle`.  This is done using the `instanceof` operator.  The operator returns `true` if `obj` has a run-time type that is a subtype of `Circle`.
- To compare `this` circle with the given circle, we have to access the center `c` and radius `r`.  But if we access `obj.c` or `obj.r`, the compiler will complain.  As far as the compiler is concerned, `obj` has the compile-time type `Object`, and there is no such fields `c` and `r` in the class `Object`!  This is why, after assuring that the run-time type of `obj` is a subtype of `Circle`, we assign `obj` to another variable `circle` that has the compile-time type `Circle`.  We finally check if the two centers are equal (again, `Point::equals` is left as an exercise) and if the two radii are equal[^2].
- The statement that assigns `obj` to `circle` involves _type casting_.  We mentioned before that Java is strongly typed, so it is very strict about type conversion.  Here, Java allows type casting from type $T$ to $S$ if $S <: T$. [^3]: This is called _narrowing type conversion_.  Unlike widening type conversion, which is always allowed and always correct, a _narrowing type conversion_ requires explicit typecasting and validation during run-time.  If we do not ensure that `obj` has the correct run-time type, casting can lead to a run-time error (which if you [recall](01-compiler.md), is bad).

[^2]: The right way to compare two floating-point numbers is to take their absolute difference and check if the difference is small enough.  We are sloppy here to keep the already complicated code a bit simpler.  You shouldn't do this in your code.

[^3]: This is not the only condition where type casting is allowed. We will look at other conditions in later units.


All these complications would go away, however, if we define `Circle::equals` to take in a `Circle` as a parameter, like this:

```Java title="Circle v0.7b with Overriding equals"
class Circle {
    :
  /**
   * Return true the object is the same circle (i.e., same center, same radius).
   */
  @Override
  public boolean equals(Circle circle) {
    return (circle.c.equals(this.c) && circle.r == this.r);
  }
}
```

This version of `equals`, however, does not override `Object::equals(Object)`.  Since we hinted to the compiler that we meant this to be an overriding method, using `@Override`, the compiler will give us an error.  This method is not treated as method overriding, since the method signature for `Circle::equals(Circle)` is different from `Object::equals(Object)`.

Why then is overriding important?  Why not just leave out the line `@Override` and live with the non-overriding, one-line, `equals` method above?

## The Power of Polymorphism

Let's consider the following example.  Suppose we have a general `contains` method that takes in an array of objects.  The array can store any type of object: `Circle`, `Square`, `Rectangle`, `Point`, `String`, etc.  The method `contains` also takes in a target `obj` to search for, and returns true if there is an object in `array` that equals to `obj`.

```Java title="contains v0.1 with Polymorphism" hl_lines="3"
boolean contains(Object[] array, Object obj) {
  for (Object curr : array) {
    if (curr.equals(obj)) {
      return true;
    }
  }
  return false;
}
```

With overriding and polymorphism, the magic happens in Line 3 &mdash; depending on the run-time type of `curr`, the corresponding, customized version of `equals` is called to compare against `obj`.   So if the run-time type of `curr` is `Circle`, then we will invoke `Circle::equals(Object)` and if the run-time type of `curr` is `Point`, then we will invoke `Point::equals(Object)`.  This, of course, assumes that `Object::equals(Object)` is overridden in both classes.

However, if `Circle::equals(Object)` takes in a `Circle` as the parameter, the call to `equals` inside the method `contains` would not invoke `Circle::equals(Circle)`.  It would invoke `Object::equals(Object)` instead due to the matching method signature, and we cannot search for `Circle` based on semantic equality.

Why is this the case?  Look closely at how the method is invoked: `curr.equals(obj)`.  Here, we can see that the parameter we are passing is `obj`.  The _compile-time_ type of `obj` is `Object` as seen from the parameter declaration at Line 2.  So at compile-time, we only know that its type is `Object`.

To have a generic `contains` method without polymorphism and overriding, we will have to do something like this:
```Java title="contains v0.2 without Polymorphism"
boolean contains(Object[] array, Object obj) {
  for (Object curr : array) {
    if (obj instanceof Circle) {
      if (curr.equals((Circle)obj)) {
        return true;
      }
    } else if (obj instanceof Square) {
      if (curr.equals((Square)obj)) {
        return true;
      }
    } else if (obj instanceof Point) {
      if (curr.equals((Point)obj)) {
        return true;
      }
    }
     :
  }
  return false;
}
```

which is not scalable since every time we add a new class, we have to come back to this method and add a new branch to the `if-else` statement!

As this example has shown, polymorphism allows us _to write succinct code that is future-proof_.  By dynamically deciding which method implementation to execute during run-time, the implementer can write short yet very general code that works for existing classes as well as new classes that might be added in the future by the client, without even the need to re-compile.

!!! note "Different Types of Polymorphism"
    The term polymorphism is used in different contexts to mean different things.  In CS2030S, when we refer to the term "polymorphism", we are referring to, more precisely, _subtype polymorphism_ (also known as inclusion polymorphism). 

    In other literature, you may come across two other types of polymorphism.  Generics (Unit 23) is also called _parametric polymorphism_.  Method overloading (Unit 13) is sometimes refer to as _ad-hoc polymorphism_.  We don't use these terms in CS2030S.

