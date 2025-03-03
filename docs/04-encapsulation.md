# Unit 4: Encapsulation

!!! abstract "Learning Objectives"

    After this unit, students should

    - understand composite data type as an even higher level abstraction over variables.
    - understand encapsulation as an object-oriented (OO) principle.
    - understand the meaning of class, object, fields, and methods, in the context of OO programming.
    - be able to define a class and instantiate one as an object in Java.
    - appreciate OO as a natural way to model the real world in programs.
    - understand reference types in Java and their differences from the primitive types.

## Abstraction: Composite Data Type

Just like functions allow programmers to group instructions, give it a name, and refer to it later, a _composite data type_ allows programmers to group _primitive types_ together, give it a name to become a new type, and refer to it later.  This is another powerful abstraction in programming languages that helps us to think at a higher conceptual level without worrying about the details.   Commonly used examples are mathematical objects such as complex numbers, 2D data points, multi-dimensional vectors, circles, etc, or everyday objects such as a person, a product, etc.

Defining composite data type allows programmers to abstract away and be separated from the concern of how a complex data type is represented.

For instance, a circle on a 2D plane can be represented by the center (_i.e.,_ `x`, `y`) and its radius `r`, or it can be represented by the top left corner (_i.e.,_ `x`,`y`) and the width `w` of the bounding square.

In C, we build a composite data type with `struct`.  For example,

```C title="A C struct to Represent a Circle"
typedef struct {
  double x, y; // (x,y) coordinate of the center.
  double r;    // radius
} circle;
```

Once we have the `struct` defined, we have a new data type called `circle`.  However, we are not completely shielded from its representation, until we write a set of functions that operates on the `circle` composite type.  For instance,

```C title="C Functions to Operate on Circle"
double circle_area(circle c) { ... };
bool   circle_contains_point(circle c, double x, double y) { ... };
bool   circle_overlaps(circle c1, circle c2) { ... };
  :
```

Implementing these functions requires knowledge of how a circle is represented.  The implementation will be different if we have a different representation of `circle` (_e.g.,_ `x` and `y` may represent the center of the circle or the top left corner of the bounding square).  But once the set of functions that operates on and manipulates circles is available, we can use the _circle_ type without worrying about the internal representation.  Of course, this assumes that we will only use the functions specifically written to work on circle type.

Additionally, the example on `circle_overlap` highlights another advantage of having a composite data type.  To see the advantage, imagine that you do not have the data type `circle`.  Then the function to check if two circles overlap would require 6 parameters.

```C
bool circle_overlaps(double x1, double y1, double r1,
    double x2, double y2, double r2) { ... };
  :
```

We have used a nice numbering to clearly indicate how the parameters are related.  Those with the same suffix belong to the same _circle_.  But another programmer may instead write it in a different order.

```C
bool circle_overlaps(double x1, double x2,
    double y1, double y2, double r1, double r2) { ... };
  :
```

Even worse, lazy programmers may even omit the suffix and make the entire code unreadable.  So the use of composite data type is like a "glue" that binds relevant data together.  That way, we know that all the elements that make up a circle will always be together.

If we decide to change the representation of a circle, then only the set of functions that operate on a circle type need to be changed, but not the code that uses circles to do other things.  In other words, the representation of the circle and the set of functions that operate on and manipulate circles, should fall on the same implementer side of the abstraction barrier.

## Abstraction: Class and Object (or, Encapsulation)

The bundling of the composite data type _and its associated functions_ forms another abstraction called a _class_.

We call the data in the class as _fields_ (also called states, attributes, or properties[^1]).  The associated functions are called _methods_.  A well-designed class maintains the abstraction barrier, properly wraps the barrier around the internal representation and implementation, and exposes just the right _method interface_ for others to use.

The concept of keeping all the data and functions operating on the data related to a composite data type together within an abstraction barrier is called _encapsulation_.

[^1]: Computer scientists just could not decide what to call this :(

Let's see how we can encapsulate the fields and methods associated together, using `Circle` as an example, in Java.

```Java title="Circle v0.1"
class Circle {
  double x;
  double y;
  double r;

  double getArea() {
    return 3.141592653589793 * r * r;
  }
}
```

The code above defines a new class using the keyword `class`, gives it a name `Circle`[^2], followed by a block listing the member variables (with types) and the function definitions.

[^2]: As a convention, we use PascalCase for class names and camelCase for variable and method names in Java.

Just like we can create variables of a given type, we can create _objects_ of a given class.  Objects are _instances_ of a class, each allowing the same methods to be called, and each containing the same set of variables of the same types, but (possibly) storing different values.

In Java, the keyword `new` creates an object of a given class.  For instance, to create a `Circle` object, we can use

```Java title="Using the Circle class"
Circle c = new Circle();
c.r = 10;    // set the radius to 10
c.getArea(); // return 314.1592653589793
```

To access the fields and the methods, we use the `.` notation.  For example, `object.field` or `object.method(..)`.  This can be seen in Line 2 and Line 3 of the example above.  {++We refer to `object` as the _target_ of the method call.++}

### A Bad Example

Let us take a moment to appreciate the example `Circle` v0.1 above.  This is a reasonable example as the method `getArea` is computing the area of the circle with the radius as specified in the field `r`.  So, we can clearly see that the method is associated with the data.  Let's now add another method `factorial` to `Circle`:

```Java title="Circle v0.1.1 with Irrelevant Method"
class Circle {
  double x;
  double y;
  double r;

  double getArea() {
    return 3.141592653589793 * r * r;
  }

  int factorial(int x) {  
    return (x == 0) ? 1 : x * factorial(x - 1);
  }
}
```

The method `factorial` is irrelevant to the class `Circle`.   It is not associated with and does not utilize the fields in the class.  Furthermore, `factorial` is a useful method that can be used in a general context, not specific to the `Circle` class.  This is a bad example of encapsulation.

## Object-Oriented Programming

A program written in an _object-oriented language_ such as Java consists of classes, with one main class as the entry point.  One can view a running object-oriented (or OO) program as something that instantiates objects of different classes and orchestrates their interactions with each other by calling each other's methods.

One could argue that an object-oriented way of writing programs is much more natural, as it mirrors our world more closely.  If we look around us, we see objects all around us, and each object has certain properties, exhibits certain behaviors, and allows certain actions.  We interact with the objects through their interfaces, and we rarely need to know the internals of the objects we use every day (unless we try to repair them)[^3].

To model a problem in an object-oriented manner, we typically model _the nouns as classes and objects, the properties or relationships among the classes as fields, and the verbs or actions of the corresponding objects as methods_.

[^3]: This is a standard analogy in an OOP textbook.  In practice, however, we often have to write programs that include abstract concepts with no tangible real-world analogy as classes.

Take, for example, the following partial problem description about an online airline reservation system.

> Users need to be able to make bookings from an origin to a destination airport which may comprise multiple connecting flights. We record the booking date.  Airport are identified by their airport code.

We can identify the following from the problem description.

| Nouns | Properties | Associated Verbs |
|-------|------------|------------------|
| User  | Bookings made | Make booking |
| Booking | Bookings date | |
|         | Origin airport |  |
|         | Destination airport | |
| Airport | Code | |

From here, we can try to model the problem in OOP using three classes: `User`, `Booking`, and `Airport`.  

```Java title="Partial Modelling of the Airline Reservation System v0.1"
class User {
  Booking booking;

  void makeBooking(Airport origin, Airport destination, Date date) {
    :
  }
}

class Airport {
  String code;
    :
}

class Booking {
  Date date;
  Airport origin;
  Airport destination;
    :
}
```

For each property, we encapsulate them as fields in the respective class.  For verb `make booking`, we encapsulate a method in the `User` class.

Can the model be simplified?  Suppose that we are sure we never need to store anything more than the airport code in `Airport`, then we can simplify the model by using a `String` instead of an `Airport` class.

```Java title="Partial Modelling of the Airline Reservation System v0.2"
class User {
  Booking booking;

  Booking makeBooking(String originAirport, String destinationAirport, Date date) {
    :
  }
}

class Booking {
  Date date;
  String origin;
  String destination;
    :
}
```

However, if we want to leave open the possibility that we may need to store more information about an airport in the future (e.g., location, name), then it is better to model it as a class even if it contains only a single property for now.

## Reference Types in Java

We mentioned in [Unit 2](02-type.md) that there are two kinds of types in Java.  You have been introduced to the primitive types.  Everything else in Java is a reference type.

The `Circle` class is an example of a reference type.  Unlike primitive variables, which never share the value, a reference variable stores only the reference to the value, and therefore two reference variables can share the same value.  For instance,

```Java title="Sharing a Circle Object"
Circle c1 = new Circle();
Circle c2 = c1;
System.out.println(c2.r); // print 0
c1.r = 10.0;
System.out.println(c2.r); // print 10.0
```

The behavior above is due to the variables `c1` and `c2` referencing to the same `Circle` object in the memory.  Therefore, changing the field `r` of `c1` causes the field `r` of `c2` to change as well.

## Special Reference Value: `null`

Any reference variable that is not initialized will have the special reference value `null`.  A common error for beginners is to declare a reference variable and try to use it without instantiating an object:

```Java
Circle c1;
c1.r = 10.0;  // error
```

Line 2 would lead to a run-time error message
```
|  Exception java.lang.NullPointerException
```

Remember to _always instantiate a reference variable_ before using it.


<!--
!!! quote
    _"There has never been an unexpectedly short debugging period in the history of computers."_

    Steven Levy
-->

## Further Readings

- Oracle's Java Tutorial on [Classes](https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html) and [Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/objects.html).
