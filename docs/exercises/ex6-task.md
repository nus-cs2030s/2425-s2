# Lab 6: Lazy

- Deadline: 25 March, 2025, Tuesday, 12:00, SGT
- Difficulty Level: 9

## Prerequisite

- Caught up to Unit 32 of Lecture Notes
- Completed Exercise 5

## Files

The following functional interfaces are already provided:

- `cs2030s.fp.Combiner`
- `cs2030s.fp.Transformer`
- `cs2030s.fp.BooleanCondition`
- `cs2030s.fp.Producer`
- `cs2030s.fp.Consumer`

Copy your implementation of `cs2030s.fp.Maybe` Exercise 5 over before you get started with Exercise 6.  A skeleton for `Lazy<T>` as well as a wrongly-implemented copy of `LazyList.java` is provided.

The files `Test1.java`, `Test2.java`, etc., as well as `CS2030STest.java`, are provided for testing.  You can edit them to add your test cases, but they will not be submitted.

## Lazy

Programming languages such as Scala support lazy values, where the expression that produces a lazy value is not evaluated until the value is needed.  Lazy value is useful for cases where producing the value is expensive, but the value might not eventually be used.  Java, however, does not provide a similar abstraction.  So, you are going to build one.

This task is divided into several stages.  You are highly encouraged to read through all the stages to see how the different levels are related.

You are required to design a single `Lazy` class as part of the `cs2030s.fp` package with two fields.  _You are not allowed to add additional fields_ to `Lazy`.

```
public class Lazy<T> {
  private Producer<? extends T> producer;
  private Maybe<T> value;

   :
}
```

Take note of the following constraints:

- Avoid using the protected `Maybe::get` method and avoid access the classes `Maybe.Some<T>` or `Maybe.None` directly.
- Since `Maybe` has internalized `if-else` checks for whether the value is there or not, you _must not use any form of conditional statements_ to compare if `value` contains something or not.
- You are not allowed to use any raw types or `@SuppressWarnings`

## The Basics of Being Lazy

Define a generic `Lazy` class to encapsulate a value with the following operations:

- static `of(T v)` method that initializes the `Lazy` object with the given value.
- static `of(Producer<? extends T> s)` method that takes in a producer that produces the value when needed.
- `get()` method that is called when the value is needed.  If the value is already available, return that value; otherwise, compute the value and return it.  The computation should only be done once for the same value.
- `toString()`: returns `"?"` if the value is not yet available; returns the string representation of the value otherwise.

Note that for our class to be immutable and to make the memorization of the value transparent, `toString` should call `get()` and should never return `"?"`.  We break the rules of immutability and encapsulation here, just so that it is easier to debug and test the laziness of your implementation.

Hint: You may find the method `valueOf` from the class `String` useful.

```
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Lazy

jshell> Lazy<Integer> eight = Lazy.of(8)
jshell> eight
eight ==> 8
jshell> eight.get()
$.. ==> 8

jshell> Producer<String> s = () -> "hello"
jshell> Lazy<Object> hello = Lazy.of(s)
jshell> Lazy<String> hello = Lazy.of(s)
jshell> hello
hello ==> ?
jshell> hello.get()
$.. ==> "hello"

jshell> s = () -> { System.out.println("world!"); return "hello"; }
jshell> Lazy<String> hello = Lazy.of(s)
jshell> hello
hello ==> ?
jshell> hello.get()
world!
$.. ==> "hello"

jshell> // check that "world!" should not be printed again.
jshell> hello.get()
$.. ==> "hello"

jshell> Random rng = new Random(1)
jshell> Producer<Integer> r = () -> rng.nextInt()
jshell> Lazy<Integer> random = Lazy.of(r)

jshell> // check that random value should not be available
jshell> random
random ==> ?

jshell> // check that random value is obtained only once
jshell> random.get().equals(random.get())
$.. ==> true

jshell> // should handle null
jshell> Lazy<Object> n = Lazy.of((Object)null)
jshell> n.toString()
$.. ==> "null"
jshell> n.get()
$.. ==> null

jshell> Lazy<Integer> n = Lazy.of((Producer<Integer>)() -> null)
jshell> n
n ==> ?
jshell> n.get()
$.. ==> null
```

You can test your code by running the `Test1.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```
$ javac cs2030s/fp/*java
$ javac -Xlint:rawtypes Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml *.java cs2030s/fp/*.java
```

## Map and FlatMap

Now let's add the `map` and `flatMap` method.  Remember that `Lazy` should not evaluate anything until `get()` is called, so the function `f` passed into `Lazy` through `map` and `flatMap` should not be evaluated until `get()` is called.  Furthermore, they should be evaluated once.  That result from `map` and `flatMap`, once evaluated, should be cached (also called _memoized_), so that function must not be called again.

```
jshell> import cs2030s.fp.Lazy
jshell> import cs2030s.fp.Producer
jshell> import cs2030s.fp.Transformer

jshell> Producer<String> s = () -> "123456"
jshell> Lazy<String> lazy = Lazy.of(s)
jshell> lazy.map(str -> str.substring(0, 1))
$.. ==> ?
jshell> lazy
$.. ==> ?
jshell> lazy.map(str -> str.substring(0, 1)).get()
$.. ==> "1"
jshell> lazy.get()
$.. ==> "123456"

jshell> Transformer<String, String> substr = str -> {
   ...>   System.out.println("substring");
   ...>   return str.substring(0, 1);
   ...> }
jshell> lazy = lazy.map(substr)
jshell> lazy.get()
substring
$.. ==> "1"
jshell> lazy.get()
$.. ==> "1"

jshell> Lazy<Integer> lazy = Lazy.of(10)
jshell> lazy = lazy.map(i -> i + 1)
jshell> lazy = lazy.flatMap(j -> Lazy.of(j + 3))
jshell> lazy
lazy ==> ?
jshell> lazy.get()
$.. ==> 14
jshell> lazy
lazy ==> 14

jshell> Transformer<Object, Integer> hash = x -> x.hashCode();
jshell> Lazy<Number> lazy = Lazy.<String>of("sunday").map(hash);
jshell> Transformer<Object, Lazy<Integer>> hash = x -> Lazy.<Integer>of(x.hashCode());
jshell> Lazy<Number> lazy = Lazy.<String>of("sunday").flatMap(hash);
```

You can test your code by running the `Test2.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```
$ javac cs2030s/fp/*java
$ javac -Xlint:rawtypes Test2.java
$ java Test2
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml *.java cs2030s/fp/*.java
```

## Filter

Write a `filter` method, which takes in a `BooleanCondition` and lazily tests if the value passes the test or not.  Returns a `Lazy<Boolean>` object.  The `BooleanCondition` must be executed at most once.

Then write an `equals`, which overrides the `equals` method in the `Object` class.  `equals` is an eager operation that causes the values to be evaluated (if not already cached).  `equals` should return true only both objects being compared are `Lazy` and the value contains within are equals (according to their `equals()` methods).

```
jshell> import cs2030s.fp.Lazy

jshell> Lazy<Integer> fifty = Lazy.of(50)
jshell> Lazy<Boolean> even = fifty.filter(i -> i % 2 == 0)
jshell> even
even ==> ?
jshell> even.get()
$.. ==> true
jshell> even
even ==> true

jshell> // equals
jshell> fifty.equals(Lazy.of(5).map(i -> i * 10))
$.. ==> true
jshell> fifty.equals(50)
$.. ==> false
jshell> fifty.equals(Lazy.of("50"))
$.. ==> false
jshell> even.equals(Lazy.of(true))
$.. ==> true

jshell> BooleanCondition<String> isHello = s -> {
   ...>   System.out.println(s);
   ...>   return s.equals("hello");
   ...> }
jshell> Lazy<Boolean> same = Lazy.of("hi").filter(isHello)
jshell> same
same ==> ?
jshell> same.get()
hi
$.. ==> false
jshell> same.get()
$.. ==> false

jshell> BooleanCondition<Object> alwaysFalse = s -> false
jshell> Lazy<Boolean> same = Lazy.<String>of("hi").filter(alwaysFalse)
```

You can test your code by running the `Test3.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```
$ javac cs2030s/fp/*java
$ javac -Xlint:rawtypes Test3.java
$ java Test3
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml *.java cs2030s/fp/*.java
```

## Combine

We have provided an interface called `Combiner<S, T, R>` in `cs2030s.fp`, with a single `combine` method to combine two values, of type `S` and `T` respectively, into a result of type `R`.

Add a method called `combine` into `Lazy`.  The `combine` method takes in another `Lazy` object and a `Combiner` implementation to lazily combine the two `Lazy` objects (which may contain values of different types) and return a new `Lazy` object.

```
jshell> import cs2030s.fp.Lazy
jshell> Lazy<Integer> five, ten, fifty, hundred
jshell> ten = Lazy.of(10)
jshell> five = Lazy.of(5)
jshell> // combine (same types)
jshell> Combiner<Integer, Integer, Integer> add = (x, y) -> {
   ...>   System.out.println("combine");
   ...>   return x + y;
   ...> }
jshell> fifty = five.combine(ten, (x, y) -> x * y)
jshell> fifty
fifty ==> ?
jshell> hundred = fifty.combine(fifty, add)
jshell> hundred
hundred ==> ?
jshell> // combine (different types)
jshell> Combiner<Integer,Double,String> f = (x, y) -> Integer.toString(x) + " " + Double.toString(y)
jshell> Lazy<String> s = Lazy.of(10).combine(Lazy.of(0.01), f)
jshell> s
s ==> ?
jshell> s.get()
$.. ==> "10 0.01"

jshell> Combiner<Object,Object,Integer> f = (x, y) -> x.hashCode() + y.hashCode()
jshell> Lazy<Number> n = Lazy.<String>of("hello").combine(Lazy.<Integer>of(123), f);
```

You can test your code by running the `Test4.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```
$ javac cs2030s/fp/*java
$ javac -Xlint:rawtypes Test4.java
$ java Test4
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml *.java cs2030s/fp/*.java
```

## Lazy List

The `Lazy` class can be used to build a lazy-evaluated list.

Consider the class `EagerList` below.  Given `n`, the size of the list, `seed`, the initial value, and `f`, an operation, we can generate an `EagerList` as `[seed, f(seed), f(f(seed)), f(f(f(seed))), ... ]`, up to `n` elements.

We can then use the method `get(i)` to find the i-th element in this list, or `indexOf(obj)` to find the index of `obj` in the list.

```Java
class EagerList<T> {
  private List<T> list;
  private EagerList(List<T> list) {
    this.list = list;
  }

  public static <T> EagerList<T> generate(int n, T seed, Transformer<T, T> f) {
    EagerList<T> eagerList = new EagerList<>(new ArrayList<>());
    T curr = seed;
    for (int i = 0; i < n; i++ ) {
        eagerList.list.add(curr);
        curr = f.transform(curr);
    }
    return eagerList;
  }

  public T get(int i) {
    return this.list.get(i);
  }

  public int indexOf(T v) {
    return this.list.indexOf(v);
  }

  @Override
  public String toString() {
    return this.list.toString();
  }
}
```

But suppose `f()` is an expensive computation, and we ended up just needing to `get(k)` where `k` is much smaller than `N`, then, we would have wasted our time computing all the remaining elements in the list!  Similarly, if the `obj` that we want to find using `indexOf` is near the beginning of the list, there is no need to compute the remaining elements of the list.

Change the `EagerList` class into a new class called `LazyList`, making use of the `Lazy` class you have constructed, so that `get()` and `indexOf()` causes evaluation of `f()` only as many times as necessary.  Hint: you only need to make minimal changes.  Neither a new field nor a new loop is necessary.

```
jshell> /open LazyList.java
jshell> Transformer<Integer, Integer> incr = x -> {
   ...>   System.out.println("x + 1");
   ...>   return x + 1;
   ...> }
jshell> LazyList<Integer> l = LazyList.generate(1000000, 0, incr);
jshell> l
l ==> [0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ...
jshell> l.indexOf(4);
x + 1
x + 1
x + 1
x + 1
$9 ==> 4
jshell> l
l ==> [0, 1, 2, 3, 4, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...
jshell> l.get(8)
x + 1
x + 1
x + 1
x + 1
$11 ==> 8
jshell> l
l ==> [0, 1, 2, 3, 4, 5, 6, 7, 8, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...
jshell> l.get(2)
$13 ==> 2
jshell> l
l ==> [0, 1, 2, 3, 4, 5, 6, 7, 8, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...
jshell> l.indexOf(4);
$15 ==> 4
jshell> l
l ==> [0, 1, 2, 3, 4, 5, 6, 7, 8, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...
jshell>
```

You can test your code by running the `Test5.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```
$ javac cs2030s/fp/*java
$ javac -Xlint:rawtypes Test5.java
$ java Test5
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml LazyList.java
```


## Following CS2030S Style Guide

You should make sure that your code follows the [given Java style guide](https://nus-cs2030s.github.io/2223-s2/style.html).
