# Exercise 5: Maybe<T>

- Deadline: 18 March, 2025, Tuesday, 12:00, SST

## Prerequisite:

- Caught up to Unit 29 of Lecture Notes
- Familiar with the CS2030S Java style guide

This is a follow-up to Exercise 4.  In Exercise 4, we have constructed a generic class `Box<T>`, which is a container for an item of type `T`.  Beyond being an exercise for teaching about generics, `Box<T>` is not a very useful type.  In Exercises 5 and 6, we are going to modify `Box<T>` into two more useful and general classes.  We are going to build our own Java packages using these useful classes.

## Java `package`

Java package mechanism allows us to group relevant classes and interfaces under a namespace. You have seen two packages so far: `java.util`, where we import `List`, `Arrays`, from, and `java.lang` where we import the `Math` class. These are provided by Java as standard libraries. We can also create our package and put the classes and interfaces into the same package. We (and the clients) can then import and use the classes and interfaces that we provide.

Java package provides a higher layer of abstraction barrier.  We can designate a class to be used outside a package by prefixing the keyword `class` with the access modifier `public`.  We can further fine-tune which fields and methods are accessible from other classes in the same package using the `protected` access modifier.

You can read more about [java packages](https://docs.oracle.com/javase/tutorial/java/package/index.html) and [the `protected` modifier](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html) yourself through Oracle's Java tutorial.

We will create a package named `cs2030s.fp` to be used for Exercises 5-8.

First, we need to add the line:
```
package cs2030s.fp;
```

on top of every `.java` file that we would like to include in the package.

Second, the package name is typically written in a hierarchical manner using the "." notation. The name also indicates the location of the `.java` files and the `.class` files. For this reason, you can no longer store the `.java` files under `ex5-username` directly. Instead, you should put them in a subdirectory called `cs2030s/fp` under `ex5-username`.
To start, our `cs2030s.fp` package will contain the two interfaces `Transformer` and `BooleanCondition` that you have written in Exercise 4.

Third, the classes or interfaces that you want to expose to others should be declared as a `public` class or interface.  You can do so by adding the keyword `public` when you declare the class or interface.  For example,
```Java
public class Transfomer<T, R> {
    :
}
```

Finally, to compile your code, under your `ex5-username` directory, run:
```
javac -Xlint:unchecked -Xlint:rawtypes cs2030s/fp/*.java *.java
```

If you have set up everything correctly, you should be able to run the following in `jshell` from your `ex5-username` directory:
```
jshell> import cs2030s.fp.Transformer;
jshell> import cs2030s.fp.BooleanCondition;
```

without error.

## More Interfaces

Now, add two more interfaces to our package:

- `Producer<T>` is an interface with a single `produce` method that takes in no parameter and returns a value of type `T`.
- `Consumer<T>` is an interface with a single `consume` method that takes in a parameter of type `T` and returns nothing.

If you have set up everything correctly, you should be able to run the following in `jshell` without errors (remember to always compile your code first!)

```
jshell> import cs2030s.fp.Producer;
jshell> import cs2030s.fp.Consumer;
jshell> Producer<String> p;
jshell> p = new Producer<>() {
   ...>   public String produce() { return ""; }
   ...> }
jshell> Consumer<Boolean> c;
jshell> c = new Consumer<>() {
   ...>   public void consume(Boolean b) { }
   ...> }
```

## Call Me `Maybe<T>`

Now, we are going to implement a type called `Maybe<T>` in the `cs2030s.fp` package.  Our `Maybe<T>` is an _option type_, a common abstraction in programming languages (`java.util.Optional` in Java, `option` in Scala, `Maybe` in Haskell, `Nullable<T>` in C#, etc) that is a wrapper around a value that might be missing.  In other words, it represents either _some_ value, or _none_.

### Inner Classes and Factory Methods

Write an abstract class called `Maybe<T>` with two concrete, static, nested classes, named `None` and `Some<T>`.

```
jshell> import cs2030s.fp.Maybe;

jshell> Maybe<Object> m = new Maybe<>();
|  Error:
|  cs2030s.fp.Maybe is abstract; cannot be instantiated
|  Maybe<Object> m = new Maybe<>();
|                    ^-----------^
```

- Both `None` and `Some<T>` inherit from `Maybe<T>`.  Note that `None` is _not_ a generic class so you need to specify `Object` as the type argument to `Maybe<T>`.
- `Some<T>` must be immutable.  
- The types `None` and `Some<T>` are internal implementation details of `Maybe<T>` and must not be used directly.  For instance, clients must not be able to declare a variable of type `Maybe.Some<T>`.

```
jshell> Maybe.None m;
|  Error:
|  cs2030s.fp.Maybe.None is not public in cs2030s.fp.Maybe; cannot be accessed from outside package
|  Maybe.None m;
|  ^--------^

jshell> Maybe.Some<Object> m;
|  Error:
|  cs2030s.fp.Maybe.Some is not public in cs2030s.fp.Maybe; cannot be accessed from outside package
|  Maybe.Some<Object> m;
|  ^--------^
```

`Maybe<T>` has two static factory methods:

- `none()` returns an instance of `None`.  Just like `Box::empty`, there should only be one instance of `None`.  Multiple calls to `none()` should return the same instance.
- `some(T t)` takes in a value `t` and returns an instance of `Some<T>` wrapped around `t` (`t` might be `null`).

Implement a `None::toString` method that always returns `[]` and a `Some::toString` methods that always return the string representation of the content between `[` and `]`.


Here are some examples of how the factory methods might be used (remember to always compile your code first!)
```
jshell> Maybe<Object> m = Maybe.none()
jshell> Maybe.none()
$.. ==> []

jshell> Maybe<Integer> m = Maybe.some(null)
jshell> Maybe.some(null)
$.. ==> [null]

jshell> Maybe<Integer> m = Maybe.some(4)
jshell> Maybe.some(4)
$.. ==> [4]

jshell> Maybe.none() == Maybe.none()
$.. ==> true
```

Implement the `equal` method such that two `None` are always equal, and two `Some<T>` instances are equal if their contents are equal.  (You might find your `Box` implementation useful).

```		
jshell> Maybe.none().equals(Maybe.none())
$.. ==> true
jshell> Maybe.none().equals(Maybe.some("day"))
$.. ==> false
jshell> Maybe.none().equals(Maybe.some(null))
$.. ==> false
jshell> Maybe.none().equals(null)
$.. ==> false

jshell> Maybe.some("day").equals(Maybe.some("day"))
$.. ==> true

jshell> Maybe.some(null).equals(Maybe.some("day"))
$.. ==> false
jshell> Maybe.some(null).equals(Maybe.some(null))
$.. ==> true
jshell> Maybe.some(null).equals(Maybe.none())
$.. ==> false
jshell> Maybe.some(null).equals(null)
$.. ==> false
```

Finally, add a static factory `of`, which returns an instance of `Some` if the input is not null, and `None` otherwise.

```
jshell> Maybe.of(null).equals(Maybe.none())
$.. ==> true
jshell> Maybe.of(null).equals(Maybe.some(null))
$.. ==> false
jshell> Maybe.of(4).equals(Maybe.none())
$.. ==> false
jshell> Maybe.of(4).equals(Maybe.some(4))
$.. ==> true
```

Add a `protected` abstract method called `get()` with a return type of `T` into `Maybe<T>`.  Implement `get()` in `None` such that it throws a `NoSuchElementException`, and in `Some<T>` such that it returns the value contained inside.  Since this method might throw an exception if the client misuses it, we keep the method `protected` and usable only within our `package`.  Due to this, we can't test it.  But keep this method in mind as it might be handy later.

```
jshell> Maybe.none().get()
|  Error:
|  get() has protected access in cs2030s.fp.Maybe
|  Maybe.none().get()
|  ^---------------^
jshell> Maybe.some(0).get()
|  Error:
|  get() has protected access in cs2030s.fp.Maybe
|  Maybe.some(0).get()
|  ^---------------^
```

You can test your code by running the `Test1.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style.

```
$ javac -Xlint:rawtypes Test1.java
$ java Test1
```

### Filter and Map (again!)

We now add the methods `filter` and `map` to `Maybe<T>`.

Create an abstract method `filter` in `Maybe<T>` that takes in a `BooleanCondition<..>` (type parameter is omitted) as a parameter and implement this method in both `None` and `Some<T>`.

Calling `filter` on `None` always returns a `None`.  Calling `filter` on `Some` should return `None` if the value in `Some` is not `null` and failed the test (i.e., the call to `test` returns `false`).  Otherwise, `filter` leaves the `Maybe` untouched and returns the `Maybe` as it is.

Here is how `filter` could be used.  Remember to always compile your code first before using it in `jshell``:

```
jshell> import cs2030s.fp.BooleanCondition
jshell> import cs2030s.fp.Maybe
jshell>
jshell> BooleanCondition<Number> isEven = new BooleanCondition<>() {
   ...>   public boolean test(Number x) {
   ...>     return x.shortValue() % 2 == 0;
   ...>   }
   ...> }
jshell> Maybe.<Integer>none().filter(isEven)
$.. ==> []
jshell> Maybe.<Integer>some(null).filter(isEven)
$.. ==> [null]
jshell> Maybe.<Integer>some(1).filter(isEven)
$.. ==> []
jshell> Maybe.<Integer>some(2).filter(isEven)
$.. ==> [2]
```

Create an abstract method `map` in `Maybe<T>` that takes in a `Transformer<...>` (type parameter omitted) as a parameter.  Implement `map` in both `None` and `Some<T>`.

Calling `map` on `None` always returns a `None`.  Call `map` on `Some<T>` should return a new `Some<T>` with the value inside transformed by the `Transformer` instance.  Note that, if the `transform` method does not handle the case where the input is `null`, a `NullPointerException` will be thrown.


```
jshell> Transformer<Integer,Integer> incr = new Transformer<>() {
   ...>   public Integer transform(Integer x) {
   ...>     return x + 1;
   ...>   }
   ...> }
jshell> Maybe.<Integer>none().map(incr)
$.. ==> []
jshell> try {
   ...>   Maybe.<Integer>some(null).map(incr); // <- error expected
   ...> } catch (NullPointerException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.NullPointerException
jshell> Maybe.<Integer>some(1).map(incr)
$.. ==> [2]

jshell> Map<String,Integer> map = Map.of("one", 1, "two", 2);
jshell> Transformer<String,Integer> wordToInt = new Transformer<>() {
   ...>   public Integer transform(String x) {
   ...>     return map.get(x);
   ...>   }
   ...> }
jshell> Maybe.<String>none().map(wordToInt)
$.. ==> []
jshell> Maybe.<String>some("").map(wordToInt)
$.. ==> [null]
jshell> Maybe.<String>some("one").map(wordToInt)
$.. ==> [1]

jshell> Transformer<String,Maybe<Integer>> wordToMaybeInt = new Transformer<>() {
   ...>   public Maybe<Integer> transform(String x) {
   ...>     return Maybe.of(map.get(x));
   ...>   }
   ...> }
jshell> Maybe.<String>none().map(wordToMaybeInt)
$.. ==> []
jshell> Maybe.<String>some("").map(wordToMaybeInt)
$.. ==> [[]]
jshell> Maybe.<String>some("one").map(wordToMaybeInt)
$.. ==> [[1]]
jshell> Maybe<Maybe<Integer>> m = Maybe.<String>some("one").map(wordToMaybeInt)

jshell> Transformer<Object,Integer> toHashCode = new Transformer<>() {
   ...>   public Integer transform(Object x) {
   ...>     return x.hashCode();
   ...>   }
   ...> }
jshell> Maybe<Integer> m = Maybe.<String>none().map(toHashCode)
$.. ==> []
jshell> Maybe<Integer> m = Maybe.<String>some("cs2030s").map(toHashCode)
$.. ==> [1008560200]
```

You can test your code by running the `Test2.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style.

```
$ javac -Xlint:rawtypes Test2.java
$ java Test2
```

Remember to make your methods as flexible as they can be in the type that they accept.

### flatMap

Consider a `Transformer` that might return a `Maybe<T>` itself (as `wordToMaybeInt` above).  Using `map` on such a `Transformer` would lead to a value wrapped around a `Maybe` twice.

Create an abstract method `flatMap` in `Maybe<T>` (and implement it in both `None` and `Some<T>`) that takes in a `Transfomer<..>` as the parameter.  The `Transformer` object transforms the value of type `T` in `Maybe<T>` into a value of type `Maybe<U>`, for some type `U`.  The method `flatMap`, however, returns a value of type `Maybe<U>` (instead of `Maybe<Maybe<U>>` as in the case of `map`).

Remember to apply PECS in your method signature so that `flatMap` is as flexible as possible.  We no longer explicitly test for it in our public test cases.

```
jshell> Map<String,Integer> map = Map.of("one", 1, "two", 2);
jshell> Transformer<String, Maybe<Integer>> wordToMaybeInt = new Transformer<>() {
   ...>   public Maybe<Integer> transform(String x) {
   ...>     return Maybe.of(map.get(x));
   ...>   }
   ...> }
jshell> Maybe.<String>none().flatMap(wordToMaybeInt)
$.. ==> []
jshell> Maybe.<String>some("").flatMap(wordToMaybeInt)
$.. ==> []
jshell> Maybe.<String>some("one").flatMap(wordToMaybeInt)
$.. ==> [1]
jshell> Maybe<Number> m = Maybe.<String>some("one").flatMap(wordToMaybeInt)
$.. ==> [1]
jshell> Transformer<Object, Maybe<Integer>> toHashCode = new Transformer<>() {
   ...>   public Maybe<Integer> transform(Object x) {
   ...>     return Maybe.of(x.hashCode());
   ...>   }
   ...> }
jshell> Maybe<Number> m = Maybe.<Object>some("one").flatMap(toHashCode)
$.. ==> [110182]
jshell> Maybe.<String>some("hello").flatMap(s -> Maybe.some(null))
$.. ==> [null]
```

You can test your code by running the `Test3.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style.

```
$ javac -Xlint:rawtypes Test3.java
$ java Test3
```


### Or Else

Since `Maybe` is an abstraction for a possibly missing value, it would be useful to provide methods that decide what to do if the value is missing.

Add an abstract method `orElse` in `Maybe<T>`.  Implement it in `None` and `Some<T>`, such that `None` returns a given value that is a subtype of `T`, while `Some<T>` just returns the value inside.  For example,

```
jshell> Maybe.<Number>none().orElse(4)
$.. ==> 4
jshell> Maybe.<Integer>some(1).orElse(4)
$.. ==> 1
```

Add an abstract method `orElseGet` in `Maybe<T>`.  `orElseGet` takes in a producer.  Implements `orElseGet` in `None` and `Some<T>`, such that `None` returns a value that is a subtype of `T` produced by the producer, while `Some<T>` just returns the value inside.  For example,

```
jshell> Producer<Double> zero = new Producer<>() {
   ...>   public Double produce() {
   ...>     return 0.0;
   ...>   }
   ...> }
jshell> Maybe.<Number>none().orElseGet(zero);
$.. ==> 0.0
jshell> Maybe.<Number>some(1).orElseGet(zero);
$.. ==> 1
```

Add an abstract method `ifPresent` in `Maybe<T>`.  `ifPresent` takes in a consumer.  Implements `ifPresent` in `None` and `Some<T>`, such that the given consumer does nothing for `None` and consumes the value inside for `Some<T>`.

```
jshell> List<Object> list = new ArrayList<>();
jshell> Consumer<Object> addToList = new Consumer<>() {
   ...>   public void consume(Object o) {
   ...>     list.add(o);
   ...>   }
   ...> }
jshell> Maybe.<Number>none().ifPresent(addToList);
jshell> list
list ==> []
jshell> Maybe.<Number>some(1).ifPresent(addToList);
jshell> list
list ==> [1]
```

You can test your code by running the `Test4.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style.

```
$ javac -Xlint:rawtypes Test4.java
$ java Test4
```

## Using `Maybe`

Now that we have our `Maybe` class, let's try to use it to do something more meaningful.

It is a common idiom (although not a good one) for a method to return a value if successful and return a `null` otherwise.  It is up to the caller to check and make sure that the return value is not `null` before using it, to prevent receiving a run-time `NullPointerException`.

One example of this is the `Map<K, V>` implemented in Java.  You have seen above that `Map::get` returns `null` if the key that you are looking for does not exist.

We have given you a program `Ex5.java` that uses multiple layers of `Map` to store information about students, their modules, and their assessment grades.  There is a method `getGrade` that, given this map, a student, a module, and an assessment, look up the corresponding grade.  There are multiple checks if a returned value is `null` in this method.

Our new `Maybe<T>` class provides a good abstraction for the returned value from `Map::get` since the value returned is either some value or none!

Your final task is to modify `getGrade` so that it uses `Maybe<T>` instead:

- Declare and initialize two `Transformer` instances using anonymous classes.  
- Use the two `Transformers`, `Maybe::of`, `Maybe::flatMap`, and `Maybe::orElse` to achieve the same functionality as the given `getGrade` in a _single return statement_.   In other words, your `getGrade` should consist of three Java statements: two to create two Transformers, and one `return` statement.   The skeleton has been given.
- Your code should not have any more conditional statements or references to `null`.

Compile your edited `Ex5` class.  The following should compile without errors or warnings.  

```
$ javac -Xlint:rawtypes Ex5.java
$ java Ex5
```

## Files

A set of empty files has been given to you.  You should only edit these files.  You must not add any additional files.

The files `Test1.java`, `Test2.java`, etc., as well as `CS2030STest.java`, are provided for testing.  You can edit them to add your test cases, but they will not be submitted.

## Following CS2030S Style Guide

You should make sure that your code follows the [given Java style guide](https://nus-cs2030s.github.io/2425-s2/style.html).  You can run `checkstyle` to check your code:

```bash
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml Ex5.java cs2030s/fp/*.java
```
