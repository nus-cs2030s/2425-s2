# Past Year PE2 Question: Try

### Adapted from PE2 of 20/21 Semester 2

## Instructions to Past-Year PE2 Question:

1. Accept the repo on GitHub Classroom [here](https://classroom.github.com/a/TGiE9pXd)
2. Log into the PE nodes and run `~cs2030s/get py2` to get the skeleton for all available past year PE1 questions.
3. The skeleton for this question can be found under `2021-s2-q1`.  You should see the following files:
    - The files `Test1.java` to `Test4.java` and `CS2030STest.java` for testing your solution.

## Background

In Java, we handle exceptions with `try` and `catch`.  For example,

```Java
Circle c;
try {
  c = new Circle(point, radius);
} catch (IllegalArgumentException e) {
  System.err.println(e.getMessage());
}
```

When we code with the functional paradigm, however, we prefer to chain our operations and keep our functions pure.  A more functional way to write this block of code is to use the `Try` monad:

```Java
Try<Circle> c = Try.of(() -> new Circle(point, radius))
```

The `Try` monad is a way to encapsulate the result of the computation if it is successful, or the reason for failure if the computational failed.  We refer to these two possibilities as success and failure respectively.  In the example above, the `Try<Circle>` instance would contain the new circle if it is a success, or an `IllegalArgumentException` if it fails.

The reason for failure can be encapsulated as an instance of the `Throwable` class.  This class is defined in the `java.lang` package and it is the parent class of `Exception` and `Error`.  A `Throwable` instance can be thrown and caught.  Note that:

 - `cs2030s.fp.Producer::produce` and `cs2030s.fp.Runnable::run` now throw a `Throwable`.
 - You don't need to call any methods or access any fields related to `Throwable` beyond catching, throwing, and converting to string.

## Your Task

You will implement the `Try` monad in this question as part of the `cs2030s.fp` package.

We break down the tasks you need to do into several sections.  We suggest that you read through the whole question, plan your solution carefully before starting.

Please be reminded of the following:

- You should design your code so that it is extensible to other possible states of computation in the future, beyond just success and failure. 

- Your code should be type-safe and catch as many type mismatches as possible during compile time.

## Assumption

You can assume that everywhere a method of `Try` accepts a functional interface or a `Throwable` as a parameter, the argument we pass in will not be `null`.  When a value is expected, however, there is a possibility that we pass in a `null` as an argument.

## The Basics

First, please implement the following methods:

- The `of` factory method, which allows us to create a new `Try` monad with a producer of type `Producer` (imported from the package `cs2030s.fp.Producer`).    Returns success if the producer produces a value successfully, or a failure containing the throwable if the producer throws an exception.

- The `success` factory method, which allows us to create a new `Try` monad with a value.  A `Try` monad created this way is always a success.

- The `failure` factory method, which allows us to create a new `Try` monad with a `Throwable`.  A `Try` monad created this way is always a failure.

- Override the `equals` method in `Object` so that it checks if two different `Try` instances are equal.  Two `Try` instances are equal if (i) they are both a success and the values contained in them are equal to each other, or (ii) they are both a failure and the `Throwable`s contained in them have the same string representation.

- Implement the method `get()`. `get()` returns the value if the `Try` is a success.  It throws the `Throwable` if it is a failure.

Study carefully how these methods can be used in the examples below:
```
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Try

jshell> Try.success(1).get();
$.. ==> 1

jshell> try {
   ...>   Try.failure(new Error()).get();
   ...> } catch (Error e) { 
   ...>   System.out.println(e);
   ...> }
java.lang.Error

jshell> Try.<Number>of((Producer<Integer>) () -> 2).get();
$.. ==> 2

jshell> try {
   ...>   Try<Number> t = Try.of(() -> 4/0);
   ...> } catch (java.lang.ArithmeticException e) { 
   ...>   System.out.println(e);
   ...> }

jshell> Try.success(3).equals(Try.success(3))
$.. ==> true
jshell> Try.success(null).equals(Try.success(null))
$.. ==> true
jshell> Try.success(3).equals(Try.success(null))
$.. ==> false
jshell> Try.success(null).equals(Try.success(3))
$.. ==> false
jshell> Try.success(3).equals(Try.success("3"))
$.. ==> false
jshell> Try.success(3).equals(3)
$.. ==> false
jshell> Try.failure(new Error()).equals(new Error())
$.. ==> false
jshell> Try.failure(new Error()).equals(Try.success(3))
$.. ==> false
jshell> Try.failure(new Error()).equals(Try.success(new Error()))
$.. ==> false
jshell> Try.success(new Error()).equals(Try.failure(new Error()))
$.. ==> false
jshell> Try.failure(new ArithmeticException()).equals(Try.failure(new Error()))
$.. ==> false
jshell> Try.failure(new ArithmeticException()).equals(Try.failure(new ArithmeticException()))
$.. ==> true
```

You can also test your code with `Test1.java`:
```
$ javac -Xlint:unchecked -Xlint:rawtypes cs2030s/fp/Try.java
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml cs2030s/fp/Try.java
```

## map 

Now, implement the `map` method so that we can apply a computation on the content of `Try`.  If `map` is called on a `Try` instance that is a failure, the same instance of `Try` is returned.  Otherwise, if it is a success, the lambda expression is applied to the value contained within `Try`.  If this lambda expression throws a `Throwable`, the calling `Try` becomes a failure containing the `Throwable` thrown.

Study carefully how `map` can be used in the examples below:
```
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Transformer
jshell> import cs2030s.fp.Try

jshell> Try.success(4).map(x -> x + 1).get();
$.. ==> 5

jshell> try {
   ...>   Try.failure(new NullPointerException()).map(x -> x.toString()).get();
   ...> } catch (NullPointerException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.NullPointerException

jshell> Try.failure(new IOException()).map(x -> x.toString()).equals(Try.failure(new IOException()));
$.. ==> true

jshell> Try.success(4).map(x -> 8 / x).map(x -> x + 1).get();
$.. ==> 3

jshell> try {
   ...>   Try.success(0).map(x -> 8 / x).map(x -> x + 1).get();
   ...> } catch (ArithmeticException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.ArithmeticException: / by zero

jshell> Transformer<Object, Integer> hash = x -> x.hashCode();
jshell> Try.success("hello").map(hash).get()
$.. ==> 99162322

jshell> try {
   ...>   Try.<Integer>success(null).map(hash).get();
   ...> } catch (NullPointerException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.NullPointerException
```

You can also test your code with `Test2.java`:
```
$ javac -Xlint:unchecked -Xlint:rawtypes cs2030s/fp/Try.java
$ javac Test2.java
$ java Test2
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml cs2030s/fp/Try.java
```

## flatMap 

Now, make `Try` a monad.  Implement the `flatMap` method so that we can compose multiple methods that produce a `Try` together.  If `flatMap` is called on a failure, return the failure.  Otherwise, if it is a success, apply the lambda expression on the value contained within `Try` and return the result.

Study carefully how `map` can be used in the examples below:
```
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Transformer
jshell> import cs2030s.fp.Try

jshell> Try.success(4).flatMap(x -> Try.success(x + 1)).get();
$.. ==> 5

jshell> try {
   ...>   Try.success(4)
   ...>       .flatMap(x -> Try.failure(new IOException()))
   ...>       .get();
   ...> } catch (IOException e) {
   ...>   System.out.println(e);
   ...> }
java.io.IOException

jshell> try {
   ...>   Try.failure(new NullPointerException())
   ...>       .flatMap(x -> Try.success(x.toString()))
   ...>       .get();
   ...> } catch (NullPointerException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.NullPointerException

jshell> Try.failure(new IOException()).flatMap(x -> Try.success(x.toString())).equals(Try.failure(new IOException()));
$.. ==> true

jshell> try {
   ...>   Try.failure(new NullPointerException())
   ...>       .flatMap(x -> Try.failure(new IOException()))
   ...>       .get();
   ...> } catch (NullPointerException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.NullPointerException

jshell> Transformer<Object, Try<Integer>> hash = x -> Try.success(x.hashCode());
jshell> Try<Number> t = Try.success("hello").flatMap(hash);
```

You can also test your code with `Test3.java`:
```
$ javac -Xlint:unchecked -Xlint:rawtypes cs2030s/fp/Try.java
$ javac Test3.java
$ java Test3
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml cs2030s/fp/Try.java
```

## Dealing with failures

The methods `map` and `flatMap` apply the given lambda to the value contained within the `Try` monad where it is a success.  Write the following method to deal with failure:

- `onFailure`: Return this instance if the calling `Try` instance is a success.  Consume the `Throwable` with a `Consumer` if it is a failure, and then either (i) return this instance if the consumer runs successfully, or (ii) return a failure instance containing the error/exception when consuming the `Throwable`.   

For example, we can use `onFailure` to replace this snippet 

```Java
Circle c;
try {
  c = new Circle(point, radius);
} catch (IllegalArgumentException e) {
  System.err.println(e.getMessage());
}
```

with:
```
Try<Circle> c = Try.of(() -> new Circle(point, radius))
                   .onFailure(System.err::println);
```

We can also recover from the failure, by turning the `Try` into a success.  Write the following method:

- `recover`: Return this instance if it is a success.  If this `Try` instance is a failure.  Apply the given `Transformer` to the `Throwable`, if the transformation is a success, return the resulting `Try`, otherwise, return a failure containing the error/exception when transforming the `Throwable`.

For example, we can use `recover` to replace this snippet 

```Java
Circle c;
try {
  c = new Circle(point, radius);
} catch (IllegalArgumentException e) {
  c = new Circle(point, 1);
}
```

with:
```Java
Try<Circle> c = Try.of(() -> new Circle(point, radius))
                   .recover(e -> new Circle(point, 1));
```

Study carefully how `onFailure` and `recover` can be used in the examples below:
```Java
jshell> import cs2030s.fp.Consumer
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Transformer
jshell> import cs2030s.fp.Try

jshell> Try.success(4).onFailure(System.out::println).get()
$.. ==> 4

jshell> try {
   ...>   Try.failure(new IOException()).onFailure(System.out::println).get();
   ...> } catch (IOException e) {
   ...>   System.out.println(e);
   ...> }
java.io.IOException
java.io.IOException

jshell> try {
   ...>   Try.failure(new IOException()).onFailure(e -> { int x = 1 / 0; }).get();
   ...> } catch (ArithmeticException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.ArithmeticException: / by zero

jshell> Consumer<Object> print = System.out::println
jshell> Try.<Number>success(4).onFailure(print).get()
$.. ==> 4

jshell> Try.success(4).recover(e -> 10).get()
$.. ==> 4
jshell> Try.failure(new IOException()).recover(e -> 10).get();
$.. ==> 10

jshell> try {
   ...>   Try.failure(new IOException()).recover(e -> e.hashCode() / 0).get();
   ...> } catch (ArithmeticException e) {
   ...>   System.out.println(e);
   ...> }
java.lang.ArithmeticException: / by zero

jshell> Transformer<Object, Integer> hash = x -> x.hashCode();
jshell> Try.<Number>success(4).recover(hash).get()
$.. ==> 4
```

You can also test your code with `Test4.java`:
```
$ javac -Xlint:unchecked -Xlint:rawtypes cs2030s/fp/Try.java
$ javac Test4.java
$ java Test4
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml cs2030s/fp/Try.java
```
