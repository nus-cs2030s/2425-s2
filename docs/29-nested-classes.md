# Unit 29: Nested Class

!!! abstract "Learning Objectives"

    After this unit, students should:
    
    - understand the need for nested class
    - understand the behavior of the different kinds of nested class
    - be able to write nested classes

So far, we have defined a class only at the "top level" of our program.  Java allows us to define a class within another class or a method.  

## Nested Class

A nested class is a class defined within another containing class.  For example, the following declaration declares a private nested class named `B` within the class `A`.

```Java
class A {
  private class B {
      :
  }
}
```

Nested classes are used to group logically relevant classes together.  Typically, a nested class is tightly coupled with the container class and would have no use outside of the container class.  Nested classes can be used to encapsulate information within a container class, for instance, when the implementation of the container class becomes too complex.  As such, it is useful for "helper" classes that serve specific purposes.

A nested class is a field of the containing class and can access fields and methods of the container class, including those declared as `private`.  We can keep the nested class within the abstraction barrier by declaring the nested class as `private` if there is no need for it to be exposed to the client outside the barrier.  

Since the nested class can access the private fields of the container class, we should introduce a nested class only if the nested class belongs to the same encapsulation as the container class.  Otherwise, the container class would leak its implementation details to the nested class.

Take the `HashMap<K,V>` class for instance.  [The implementation of `HashMap<K,V>`](https://github.com/openjdk-mirror/jdk7u-jdk/blob/master/src/share/classes/java/util/HashMap.java) contains several nested classes, including `HashIterator`, which implement an `Iterator<E>` interface for iterating through the key and value pairs in the map, and an `Entry<K,V>` class, which encapsulates a key-value pair in the map.  Some of these classes are declared `private`, as they are only used within the `HashMap<K,V>` class.

!!! note "Example from CS2030S This Semester"

    We can take another example from your labs on bank simulation.  In one of many possible designs, the subclasses of `Event`: `ArrivalEvent`, `DepartureEvent`, etc. are not used anywhere outside of `BankSimulation`.  They can be safely encapsulated within `BankSimulation` as inner classes, so that these classes can access the fields within the `BankSimulation` class, simplifying their implementation.

A nested class can be either static or non-static.  Just like static fields and static methods, a _static nested class_ is associated with the containing _class_, NOT an _instance_.  So, it can only access static fields and static methods of the containing class.  A _non-static nested class_, on the other hand, can access all fields and methods of the containing class.  A _non-static nested class_ is also known as an _inner class_.

The example below shows a container class `A` with two nested classes, a non-static inner class `B`, and a static nested class `C`.  `B` can access instance fields, instance methods, class fields, and class methods in `A`.  `C` can only access the class fields and class methods in `A`.

```Java
class A {
  private int x;
  private static int y;

  private class B {
    void foo() {
      x = 1; // accessing x from A is OK
      y = 1; // accessing y from A is OK
    }
  }

  private static class C {
    void bar() {
      x = 1; // accessing x from A is not OK since C is static
      y = 1; // accessing y is OK
    }
  }
}
```

Recall that we recommend that all access to instance fields be done through the `this` reference.  In the example above, however, we can't access `this.x` from within `B`.

```Java
class A {
 private int x;

 private class B {
   void foo() {
     this.x = 1; // error
   }
 }
}
```

Since `this.x` is called within a method of `B`, `this` would refer to the instance of `B`, rather than the instance of `A`.  Java has a piece of syntax called _qualified `this`_ to resolve this.  A qualified `this` reference is prefixed with the enclosing class name, to differentiate between the `this` of the inner class and the `this` of the enclosing class.  In the example above, we can access `x` from `A` through the `A.this` reference.

```Java
class A {
  private int x;

  private class B {
    void foo() {
      A.this.x = 1; // ok
    }
  }
}
```

### Hiding Nested Classes

When we use nested classes for encapsulating the implementation details of the enclosing class, it is better to declare them as `private` nested classes, so that they are not exposed across the abstract barrier, adhering to the information hiding principle.  For example, consider the following

```Java
class A {
  private class B {
    public void buz() { 
    }
  }
  private static class C {
  }
}
```

We cannot access `A.B` or `A.C` 

```Java
A.B b; // compilation error
A.C c; // compilation error
```

Note that it is still possible to expose instances of private nested classes outside the enclosing class.  For example, let's say we have:

```Java
class A {
  private class B {
    public void buz() { 
    }
  }
  B foo() {
    return new B();
  }
}
```

We are allowed to call `A::foo` and obtain a reference to an instance of `B`, as long as the type `B` is not used directly.

```Java
A a = new A();
a.foo();         // return an instance of A.B is OK
A.B b = a.foo(); // still not allowed since the type A.B is private
```

Since the type `A.B` is private to within `A`, we cannot call methods of `B` outside of `A` as well.

```Java
A a = new A();
a.foo().buz();  // error since `buz` is defined in a private nested class
```

When a nested class does not expose implementation details and is an essential part of the methods provided by the class, it is useful to expose the nested classes across the abstraction barrier. For example, Java's `Map` has a nested type `Entry<K, V>` that is public.

Consider the example below, where `A` has two public nested classes `B` and `C`.

```Java
class A {
  public class B {
    public void buz() { 
    }
  }
  public static class C {
  }
}
```

We can declare variables of type `A.B` and `A.C`

```Java
A.B b;  // ok
A.C c;  // ok
```

and initialize them like so

```Java
A a = new A();
A.B b = a.new B();
A.C c = new A.C();
```

Note that syntax to create an instance of `B` is `a.new B()`, not `new a.B()`.

### Local Class

We can also declare a class within a function, just like a local variable.  

To motivate this, let's consider how one would use the [`java.util.Comparator`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Comparator.html) interface.    
The `Comparator` interface allows us to specify how to compare two elements, by implementing this interface with a customized `compare()` method.  `compare(o1,o2)` should return 0 if the two elements are equal, a negative integer if o1 is "less than" o2, and a positive integer otherwise.

Suppose we have a list of strings, and we want to sort them in the order of their length, we can write the following method:

```Java
void sortNames(List<String> names) {

  class NameComparator implements Comparator<String> {
    public int compare(String s1, String s2) {
      return s1.length() - s2.length();
    }
  }

  names.sort(new NameComparator());
}
```

This makes the code easier to read since we keep the definition of the class and its usage closer together.

Classes like `NameComparator` that are declared inside a method (or to be more precise, inside a block of code between `{` and `}`) is called a _local class_.  Just like a local variable, a local class is scoped within the method.  Like a nested class, a local class has access to the variables of the enclosing class through the qualified `this` reference.  Further, it can access the local variables of the enclosing method.

For example,

```Java
class A {
  int x = 1;

  void f() {
    int y = 1;

    class B {
      void g() {
        x = y; // accessing x and y is OK.
      }
    }

    new B().g();
  }
}
```

Here, `B` is a local class defined in method `f()`.  It has access to all the local variables accessible from within `f`, as well as the fields of its enclosing class.

### Variable Capture

Recall that when a method returns, all local variables of the methods are removed from the stack.  But, an instance of that local class might still exist.  Consider the following example:

```Java
interface C {
  void g();
}

class A {
  int x = 1;

  C f() {
    int y = 1;
 
    class B implements C {
      void g() {
        x = y; // accessing x and y is OK.
      }
    }

    B b = new B();
    return b;
  }
}
```

Calling
```Java
A a = new A();
C b = a.f();
b.g();
```

will give us a reference to an object of type `B` now.  But, if we call `b.g()`, what is the value of `y`?

For this reason, even though a local class can access the local variables in the enclosing method, the local class makes _a copy of local variables_ inside itself.  We say that a local class _captures_ the local variables.   

### Effectively `final`

Variable captures can be confusing.  Consider the following code:

```Java
void sortNames(List<String> names) {
  boolean ascendingOrder = true;
  class NameComparator implements Comparator<String> {
    public int compare(String s1, String s2) {
      if (ascendingOrder)
        return s1.length() - s2.length();
      else
        return s2.length() - s1.length();
    }
  }

  ascendingOrder = false;
  names.sort(new NameComparator());
}
```

Will `sort` sorts in ascending order (i.e., use the value of `ascendingOrder` when the class is declared) or descending order (i.e., use the value of `ascendingOrder` when the class is instantiated)?

To avoid confusion like this, Java only allows a local class to access variables that are explicitly declared `final` or implicitly final (or _effectively_ final).  An implicitly final variable cannot be re-assigned after initialization.  Therefore, Java saves us from such a hair-pulling situation and disallows such code &mdash; `ascendingOrder` is not effectively final so the code above does not compile.

**Breaking the Limitation of Effectively `final`.** &nbsp;&nbsp; The limitation of effectively final only happens because the value is of a primitive type.  So, if we capture the value and forbid re-assigning the value, there is nothing we can do to change the primitive value.

On the other hand, reference types can be mutated. So if we use our own implementation of `Bool` class below instead of `boolean` primitive type, we can modify the code above to allow the "value" in variable `ascendingOrder` to be changed. However, this change is via mutation and not re-assignment to the variable.


```Java
void sortNames(List<String> names) {
  Bool ascendingOrder = new Bool(true);
  class NameComparator implements Comparator<String> {
    public int compare(String s1, String s2) {
      if (ascendingOrder.val)
        return s1.length() - s2.length();
      else
        return s2.length() - s1.length();
    }
  }

  ascendingOrder.val = false;
  names.sort(new NameComparator());
}

class Bool {
  boolean val;
}
```

The code above compiles correctly now.  But, as a result, the behavior of the code is not as intuitive as before.  So please exercise this workaround with extreme caution.

!!! note "Variable Capture in JavaScript"
    Those of you who did CS1101S or are otherwise familiar with JavaScript might want to note that this is different from JavaScript, which does not enforce the final/effectively final restriction in variable captures.  This is because there is no concept of primitive value in JavaScript.
    
    Every single primitive type is automatically boxed in JavaScript. The unboxed variant is not available to the programmer directly.  So, if we write `x = 1` in JavaScript, the value `1` is boxed and put into the heap.  Then, the variable `x` in the stack points to this box in the heap, unlike Java primitive type.

### Anonymous Class

An anonymous class is one where you declare a local class and instantiate it in a single statement.  This is a syntactic sugar to allow programmers to declare quickly a "single-use" class -- a class that we use only once and never need again.  We don't even need to give the class a name (hence, anonymous).

```Java
names.sort(new Comparator<String>() {
  public int compare(String s1, String s2) {
    return s1.length() - s2.length();
 }
});
```

The example above removes the need to declare a class just to compare two strings.  

An anonymous class has the following format: `new X (arguments) { body }`, where:

- _X_ is a class that the anonymous class extends or an interface that the anonymous class implements.  X cannot be empty.  This syntax also implies an anonymous class cannot extend another class and implement an interface at the same time.  Furthermore, an anonymous class cannot implement more than one interface.
Put simply, you cannot have `extends` and `implements` keywords in between `X` and `(arguments)`.
- _arguments_ are the arguments that you want to pass into the constructor of the anonymous class.  If the anonymous class is extending an interface, then there is no constructor, but we still need `()`.
- _body_ is the body of the class as per normal, except that we cannot have a constructor for an anonymous class.

The syntax might look overwhelming at the beginning, but we can also write it as:

```Java
Comparator<String> cmp = new Comparator<String>() {
  public int compare(String s1, String s2) {
    return s1.length() - s2.length();
  }
};
names.sort(cmp);
```

Line 1 above looks just like what we do when we instantiate a class, except that we are instantiating an interface with a `{ .. }` body.

Like a local class, an anonymous class captures the variables of the enclosing scope as well &mdash; the same rules to variable access as local classes apply.
