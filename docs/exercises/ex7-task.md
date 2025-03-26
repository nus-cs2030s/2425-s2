# Exercise 7: InfiniteList

- Deadline: 8 April 2025, Tuesday, 12:00, SGT

## Prerequisite

- Caught up to Unit 34 of Lecture Notes
- Completed Exercise 6

## Files

The following functional interfaces are already provided:

- `cs2030s.fp.Combiner`
- `cs2030s.fp.Transformer`
- `cs2030s.fp.BooleanCondition`
- `cs2030s.fp.Producer`
- `cs2030s.fp.Consumer`

Copy your implementation of `cs2030s.fp.Maybe` and `cs2030s.fp.Lazy` over before you start Exercise 7.  A skeleton for `InfiniteList<T>` is provided.

The files `Test1.java`, `Test2.java`, etc., as well as `CS2030STest.java`, are provided for testing.  You can edit them to add your test cases, but they will not be submitted.

## InfiniteList

You have seen in class a poorly implemented version of `InfiniteList`.  Recall that there are two issues: (i) It uses `null` to represent a missing value.  This design prevents us from having `null` as elements in the list; (ii) Produced values are not memoized.  This design results in repeated computation of the same value.

Fortunately, you have built `Maybe<T>` in Exercise 5, which will solve (i), and `Lazy<T>` in Exercise 6, which will solve (ii).  We will use them to build a better version of `InfiniteList` here.

You are required to implement a single `InfiniteList` class as part of the `cs2030s.fp` package with _only two instance fields.  No other instance fields are needed and allowed_.  You may add one class field (see below).

```Java
public class InfiniteList<T> {
  private Lazy<Maybe<T>> head;
  private Lazy<InfiniteList<T>> tail;
}
```

### Constraints
Take note of the following constraints:

- You are not allowed to use any raw types.
- `@SuppressWarnings` must be used responsibly.
- You must not use `java.util.stream.Stream` to solve this lab.

For Exercise 7, use of conditional statements (e.g., `if`, `else`, `? :`) in your implementation as well as checking if a `Maybe` instance equals to `Maybe::none()` is unavoidable.  As much as possible, you should still keep your code succinct by using `Maybe<T>` and `Lazy<T>` to handle the conditional logic.

## The Basics

Write the static `generate` and `iterate` methods that create an `InfiniteList`.

To access the elements of the list, provide the `head` and `tail` method that produces the head and tail of the infinite list.

To help with debugging, a `toString` method has been provided for you.

```Java
jshell> import cs2030s.fp.InfiniteList;
jshell> import cs2030s.fp.Transformer;
jshell> import cs2030s.fp.Producer;

jshell> InfiniteList.generate(() -> 1)
$.. ==> [? ?]
jshell> InfiniteList.generate(() -> 1).head()
$.. ==> 1
jshell> InfiniteList.generate(() -> null).tail().head()
$.. ==> null
jshell> InfiniteList.iterate("A", x -> x + "Z").head()
$.. ==> "A"
jshell> InfiniteList.iterate("A", x -> x + "Z").tail().head()
$.. ==> "AZ"
jshell> InfiniteList.iterate("A", x -> x + "Z").tail().tail().head()
$.. ==> "AZZ"

jshell> Transformer<Integer, Integer> incr = x -> {
   ...>     System.out.println("    iterate: " + x);
   ...>     return x + 1;
   ...> }
jshell> InfiniteList<Integer> numbers = InfiniteList.iterate(1, incr)
jshell> numbers
numbers ==> [[1] ?]

jshell> numbers.head() 
$.. ==> 1
jshell> numbers
numbers ==> [[1] ?]

jshell> numbers.tail().head() 
    iterate: 1
$.. ==> 2
jshell> numbers
numbers ==> [[1] [[2] ?]]

jshell> numbers.tail().head() 
$.. ==> 2
jshell> numbers
numbers ==> [[1] [[2] ?]]

jshell> numbers.tail().tail().head() 
    iterate: 2
$.. ==> 3
jshell> numbers
numbers ==> [[1] [[2] [[3] ?]]]

jshell> numbers.tail().head() 
$.. ==> 2
jshell> numbers
numbers ==> [[1] [[2] [[3] ?]]]

jshell> Producer<Integer> zero = () -> {
   ...>     System.out.println("    generate: 0");
   ...>     return 0;
   ...> }
jshell> InfiniteList<Integer> zeros = InfiniteList.generate(zero)
jshell> zeros
zeros ==> [? ?]

jshell> zeros.head() 
    generate: 0
$.. ==> 0
jshell> zeros
zeros ==> [[0] ?]

jshell> zeros.tail().head() 
    generate: 0
$.. ==> 0
jshell> zeros
zeros ==> [[0] [[0] ?]]

jshell> zeros.head()
$.. ==> 0
jshell> zeros
zeros ==> [[0] [[0] ?]]

jshell> zeros.tail().head()
$.. ==> 0
jshell> zeros
zeros ==> [[0] [[0] ?]]

jshell> zeros.tail().tail().head() 
    generate: 0
$.. ==> 0
jshell> zeros
zeros ==> [[0] [[0] [[0] ?]]]

jshell> zeros.tail().head()
$.. ==> 0
jshell> zeros
zeros ==> [[0] [[0] [[0] ?]]]


```

You can test your code by running the `Test1.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.
```bash
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test1.java
$ java Test1
```

## `map`

Now let's add the `map` method.  The `map` method (lazily) applies the given transformation to each element in the list and returns the resulting `InfiniteList`.

```Java
jshell> import cs2030s.fp.InfiniteList;
jshell> import cs2030s.fp.Transformer;
jshell> import cs2030s.fp.Producer;

jshell> InfiniteList.generate(() -> 1).map(x -> x * 2)
$.. ==> [? ?]
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * 2)
$.. ==> [? ?]
jshell> InfiniteList.generate(() -> 1).map(x -> x * 2).tail().head()
$.. ==> 2
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * 2).head()
$.. ==> 2
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * 2).tail().head()
$.. ==> 4
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * 2).map(x -> x - 1).head()
$.. ==> 1
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * 2).map(x -> x - 1).tail().head()
$.. ==> 3
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x % 2 == 0 ? null : x).tail().head()
$.. ==> null

jshell> Producer<Integer> one = () -> {
   ...>     System.out.println("    generate: 1");
   ...>     return 1;
   ...> }
jshell> Transformer<Integer,Integer> doubler = x -> {
   ...>     System.out.println("    map x * 2: " + x);
   ...>     return x * 2;
   ...> }

jshell> InfiniteList.generate(one).map(doubler).tail().head()
    generate: 1
    map x * 2: 1
    generate: 1
    map x * 2: 1
$.. ==> 2

jshell> InfiniteList<Integer> ones = InfiniteList.generate(one)
jshell> InfiniteList<Integer> twos = ones.map(doubler)
jshell> ones
ones ==> [? ?]
jshell> twos
twos ==> [? ?]

jshell> twos.tail().head()
    generate: 1
    map x * 2: 1
    generate: 1
    map x * 2: 1
$.. ==> 2
jshell> ones
ones ==> [[1] [[1] ?]]
jshell> twos
twos ==> [[2] [[2] ?]]

jshell> twos.head()
$.. ==> 2
jshell> twos.tail().head()
$.. ==> 2


```

You can test your code by running the `Test2.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.

```bash
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test2.java
$ java Test2
```

## `filter`

Add the `filter` method to filter out elements in the list that fail a given `BooleanCondition`.  `filter` should mark any filtered (i.e., removed) element as `Maybe.none()` instead of `null`.  The resulting (lazily) filtered `InfiniteList` is returned.

```Java
jshell> import cs2030s.fp.BooleanCondition
jshell> import cs2030s.fp.InfiniteList
jshell> import cs2030s.fp.Transformer

jshell> InfiniteList.generate(() -> 1).filter(x -> x % 2 == 0)
$.. ==> [? ?]
jshell> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0)
$.. ==> [? ?]
jshell> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).head()
$.. ==> 2
jshell> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).filter(x -> x > 4).head()
$.. ==> 6

jshell> Transformer<Integer, Integer> incr = x -> {
   ...>   System.out.println("    iterate: " + x);
   ...>   return x + 1;
   ...> }

jshell> BooleanCondition<Integer> isEven = x -> {
   ...>   System.out.println("    filter x % 2 == 0: " + x);
   ...>   return x % 2 == 0;
   ...> }

jshell> InfiniteList.iterate(1, incr).filter(isEven).tail().head()
    filter x % 2 == 0: 1
    iterate: 1
    filter x % 2 == 0: 2
    iterate: 2
    filter x % 2 == 0: 3
    iterate: 3
    filter x % 2 == 0: 4
$.. ==> 4

jshell> InfiniteList<Integer> nums = InfiniteList.iterate(1, x -> x + 1)
jshell> InfiniteList<Integer> evens = nums.filter(x -> x % 2 == 0)

jshell> evens.tail().head()
$.. ==> 4
jshell> nums.toString()
$.. ==> "[[1] [[2] [[3] [[4] ?]]]]"
jshell> evens.toString()
$.. ==> "[[] [[2] [[] [[4] ?]]]]"

jshell> nums.tail().head()
$.. ==> 2
jshell> evens.tail().head()
$.. ==> 4

jshell> BooleanCondition<Integer> moreThan5 = x -> { 
   ...>   System.out.println("    filter x > 5: " + x);
   ...>   return x > 5;
   ...> }
jshell> BooleanCondition<Integer> isEven = x -> { 
   ...>   System.out.println("    filter x % 2 == 0: " + x);
   ...>   return x % 2 == 0;
   ...> }
jshell> Transformer<Integer, Integer> doubler = x -> {
   ...>   System.out.println("    map x * 2: " + x);
   ...>   return x * 2;
   ...> }

jshell> InfiniteList.iterate(1, incr).filter(moreThan5).filter(isEven).head()
    filter x > 5: 1
    iterate: 1
    filter x > 5: 2
    iterate: 2
    filter x > 5: 3
    iterate: 3
    filter x > 5: 4
    iterate: 4
    filter x > 5: 5
    iterate: 5
    filter x > 5: 6
    filter x % 2 == 0: 6
$.. ==> 6
jshell> InfiniteList.iterate(1, incr).map(doubler).filter(moreThan5).filter(isEven).tail().head()
    map x * 2: 1
    filter x > 5: 2
    iterate: 1
    map x * 2: 2
    filter x > 5: 4
    iterate: 2
    map x * 2: 3
    filter x > 5: 6
    filter x % 2 == 0: 6
    iterate: 3
    map x * 2: 4
    filter x > 5: 8
    filter x % 2 == 0: 8
$.. ==> 8
jshell> InfiniteList.iterate(1, incr).filter(isEven).map(doubler).filter(moreThan5).head()
    filter x % 2 == 0: 1
    iterate: 1
    filter x % 2 == 0: 2
    map x * 2: 2
    filter x > 5: 4
    iterate: 2
    filter x % 2 == 0: 3
    iterate: 3
    filter x % 2 == 0: 4
    map x * 2: 4
    filter x > 5: 8
$.. ==> 8


```

You can test your code by running the `Test3.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.

```Java
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test3.java
$ java Test3
```

## `sentinel` and `isSentinel`

We now consider the situation where the list can be finite.  In this case, we need to mark the end of the list with a special tail (aka a sentinel).  Create a static nested class in `InfiniteList<T>` called `Sentinel` to represent a list that contains nothing and is used to mark the end of the list. You may add one final class field `SENTINEL` (similar to EMPTY from Exercise 4 and NONE from Exercise 5) in your `InfiniteList` to cache a single instance of the sentinel. Override the `toString` method so that a sentinel returns `"-"`.

Provide a boolean `isSentinel` method that returns true if the list is an instance of `Sentinel` and returns false otherwise.  Note that `isSentinel` is a lazy operation and should not trigger the evaluation of the infinite list.

Provide an `sentinel` method that returns a sentinel.

```Java
jshell> import cs2030s.fp.BooleanCondition
jshell> import cs2030s.fp.InfiniteList
jshell> import cs2030s.fp.Transformer
jshell> import cs2030s.fp.Producer

jshell> InfiniteList.iterate(1, x -> x + 1).isSentinel()
$.. ==> false
jshell> InfiniteList.generate(() -> 2).isSentinel()
$.. ==> false
jshell> InfiniteList.generate(() -> 2).filter(x -> x % 3 == 0).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> 2).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).isSentinel()
$.. ==> false

jshell> InfiniteList.sentinel()
$.. ==> -
jshell> InfiniteList.sentinel().isSentinel()
$.. ==> true
jshell> InfiniteList.sentinel().map(x -> 2).isSentinel()
$.. ==> true
jshell> InfiniteList.sentinel().filter(x -> true).isSentinel()
$.. ==> true
jshell> InfiniteList.sentinel().filter(x -> false).isSentinel()
$.. ==> true
```

## `limit`, `toList`

Now that we have a way to terminate an infinite list into a finite list, write a `limit` method that takes in a value `n` and truncates the `InfiniteList<T>` to a finite list with at most `n` elements.
Your `limit` method must not count elements that are filtered out by `filter`, if any.

Now, provide a terminal `toList` method that collects the elements in the `InfiniteList<T>` into a `java.util.List`.  You may refer to `java.util.ArrayList` for methods that might be useful for implementing this method.

```Java
jshell> import cs2030s.fp.BooleanCondition
jshell> import cs2030s.fp.InfiniteList
jshell> import cs2030s.fp.Transformer
jshell> import cs2030s.fp.Producer

jshell> InfiniteList.sentinel().limit(4).isSentinel()
$.. ==> true
jshell> InfiniteList.iterate(1, x -> x + 1).limit(0).isSentinel()
$.. ==> true
jshell> InfiniteList.iterate(1, x -> x + 1).limit(1).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, x -> x + 1).limit(10).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, x -> x + 1).limit(-1).isSentinel()
$.. ==> true
jshell> InfiniteList.iterate(1, x -> x + 1).limit(0).isSentinel()
$.. ==> true
jshell> InfiniteList.iterate(1, x -> x + 1).limit(1).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, x -> x + 1).limit(10).isSentinel()
$.. ==> false

jshell> InfiniteList.generate(() -> 1).limit(4)
$.. ==> [? ?]
jshell> InfiniteList.iterate(1, x -> x + 1).limit(4)
$.. ==> [[1] ?]
jshell> InfiniteList.iterate(1, x -> x + 1).limit(1).head()
$.. ==> 1
jshell> InfiniteList.iterate(1, x -> x + 1).limit(4).head()
$.. ==> 1

jshell> <T> T run(Producer<T> p) {
   ...>   try {
   ...>     return p.produce();
   ...>   } catch (Exception e) {
   ...>     System.out.println(e);
   ...>     return null;
   ...>   }
   ...> }

jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(1).tail().head());
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(0).head()); 
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(4).tail().tail().head());
$.. ==> 3
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(4).limit(1).tail().head());
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(1).limit(4).tail().head());
java.util.NoSuchElementException
$.. ==> null

jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).limit(0).head());
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).limit(1).head());
$.. ==> 2
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(1).filter(x -> x % 2 == 0).head());
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, x -> x + 1).limit(2).filter(x -> x % 2 == 0).head());
$.. ==> 2

jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").limit(2).map(s -> s.length()).head());
$.. ==> 1
jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").limit(2).map(s -> s.length()).tail().head());
$.. ==> 2
jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").limit(2).map(s -> s.length()).tail().tail().head());
java.util.NoSuchElementException
$.. ==> null

jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").map(s -> s.length()).limit(2).head());
$.. ==> 1
jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").map(s -> s.length()).limit(2).tail().head());
$.. ==> 2
jshell> run(() -> InfiniteList.iterate("A", s -> s + "Z").map(s -> s.length()).limit(2).tail().tail().head());
java.util.NoSuchElementException
$.. ==> null

jshell> InfiniteList.<String>sentinel().toList()
$.. ==> []
jshell> InfiniteList.iterate("A", s -> s + "Z").map(s -> s.length()).limit(2).toList()
$.. ==> [1, 2]
jshell> InfiniteList.iterate("A", s -> s + "Z").limit(2).map(s -> s.length()).toList()
$.. ==> [1, 2]
jshell> InfiniteList.iterate(1, x -> x + 1).limit(2).filter(x -> x % 2 == 0).toList()
$.. ==> [2]
jshell> InfiniteList.iterate(1, x -> x + 1).filter(x -> x % 2 == 0).limit(2).toList()
$.. ==> [2, 4]
jshell> InfiniteList.iterate(0, x -> x + 1).filter(x -> x > 10).map(x -> x.hashCode() % 30).filter(x -> x < 20).limit(5).toList()
$.. ==> [11, 12, 13, 14, 15]
jshell> Random rng = new Random(1)
jshell> InfiniteList.generate(() -> rng.nextInt() % 100).filter(x -> x > 10).limit(4).toList()
$.. ==> [76, 95, 26, 69]
jshell> InfiniteList.generate(() -> null).limit(4).limit(1).toList()
$.. ==> [null]
jshell> InfiniteList.generate(() -> null).limit(1).limit(4).toList()
$.. ==> [null]
```

You can test your code by running the `Test4.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.

```bash
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test4.java
$ java Test4
```

## `takeWhile`

Now, implement the `takeWhile` method.  The method takes in a `BooleanCondition<T>`, and truncates the list as soon as it finds an element that evaluates the condition to false.

Just like `limit`, the `takeWhile` method should ignore elements that have been filtered out by `filter`.

```Java
jshell> import cs2030s.fp.InfiniteList;
jshell> import cs2030s.fp.Transformer;
jshell> import cs2030s.fp.Producer;
jshell> import cs2030s.fp.BooleanCondition;

jshell> Transformer<Integer, Integer> incr = x -> { 
   ...>   System.out.println("    iterate: " + x);
   ...>   return x + 1;
   ...> };
jshell> BooleanCondition<Integer> lessThan0 = x -> { 
   ...>   System.out.println("    takeWhile x < 0: " + x);
   ...>   return x < 0;
   ...> };
jshell> BooleanCondition<Integer> lessThan2 = x -> { 
   ...>   System.out.println("    takeWhile x < 2: " + x);
   ...>   return x < 2;
   ...> };
jshell> BooleanCondition<Integer> lessThan5 = x -> { 
   ...>   System.out.println("    takeWhile x < 5: " + x);
   ...>   return x < 5;
   ...> };
jshell> BooleanCondition<Integer> lessThan10 = x -> { 
   ...>   System.out.println("    takeWhile x < 10: " + x);
   ...>   return x < 10;
   ...> };
jshell> BooleanCondition<Integer> isEven = x -> { 
   ...>   System.out.println("    filter x % 2 == 0: " + x);
   ...>   return x % 2 == 0;
   ...> };

jshell> <T> T run(Producer<T> p) {
   ...>   try {
   ...>     return p.produce();
   ...>   } catch (Exception e) {
   ...>     System.out.println(e);
   ...>     return null;
   ...>   }
   ...> }

jshell> InfiniteList.<Integer>sentinel().takeWhile(lessThan0).isSentinel()
$.. ==> true
jshell> InfiniteList.iterate(1, incr).takeWhile(lessThan0).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, incr).takeWhile(lessThan2).isSentinel()
$.. ==> false
jshell> InfiniteList.iterate(1, incr).takeWhile(lessThan5).takeWhile(lessThan2).toList()
    takeWhile x < 5: 1
    takeWhile x < 2: 1
    iterate: 1
    takeWhile x < 5: 2
    takeWhile x < 2: 2
$.. ==> [1]
jshell> InfiniteList.iterate(1, incr).filter(isEven).takeWhile(lessThan10).toList()
    filter x % 2 == 0: 1
    iterate: 1
    filter x % 2 == 0: 2
    takeWhile x < 10: 2
    iterate: 2
    filter x % 2 == 0: 3
    iterate: 3
    filter x % 2 == 0: 4
    takeWhile x < 10: 4
    iterate: 4
    filter x % 2 == 0: 5
    iterate: 5
    filter x % 2 == 0: 6
    takeWhile x < 10: 6
    iterate: 6
    filter x % 2 == 0: 7
    iterate: 7
    filter x % 2 == 0: 8
    takeWhile x < 10: 8
    iterate: 8
    filter x % 2 == 0: 9
    iterate: 9
    filter x % 2 == 0: 10
    takeWhile x < 10: 10
$.. ==> [2, 4, 6, 8]

jshell> run(() -> InfiniteList.generate(() -> 2).takeWhile(lessThan0));
$.. ==> [? ?]
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan0));
$.. ==> [? ?]
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan0).head());
    takeWhile x < 0: 1
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan2).head());
    takeWhile x < 2: 1
$.. ==> 1
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan2).tail().head());
    takeWhile x < 2: 1
    iterate: 1
    takeWhile x < 2: 2
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan2).takeWhile(lessThan0).head());
    takeWhile x < 2: 1
    takeWhile x < 0: 1
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan0).takeWhile(lessThan2).head());
    takeWhile x < 0: 1
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, incr).takeWhile(lessThan5).takeWhile(lessThan2).tail().head());
    takeWhile x < 5: 1
    takeWhile x < 2: 1
    iterate: 1
    takeWhile x < 5: 2
    takeWhile x < 2: 2
java.util.NoSuchElementException
$.. ==> null
jshell> run(() -> InfiniteList.iterate(1, incr).filter(isEven).takeWhile(lessThan10).head());
    filter x % 2 == 0: 1
    iterate: 1
    filter x % 2 == 0: 2
    takeWhile x < 10: 2
$.. ==> 2
jshell> run(() -> InfiniteList.iterate(1, incr).filter(isEven).takeWhile(lessThan10).tail().head());
    filter x % 2 == 0: 1
    iterate: 1
    filter x % 2 == 0: 2
    takeWhile x < 10: 2
    iterate: 2
    filter x % 2 == 0: 3
    iterate: 3
    filter x % 2 == 0: 4
    takeWhile x < 10: 4
$.. ==> 4

jshell> InfiniteList<Integer> list = InfiniteList.iterate(1, incr).takeWhile(lessThan10)

jshell> list.tail().tail().head()
    takeWhile x < 10: 1
    iterate: 1
    takeWhile x < 10: 2
    iterate: 2
    takeWhile x < 10: 3
$.. ==> 3
jshell> list.head()
$.. ==> 1
jshell> list
list ==> [[1] [[2] [[3] ?]]]

jshell> list.tail().head()
$.. ==> 2
jshell> list.tail().tail().tail().head()
    iterate: 3
    takeWhile x < 10: 4
$.. ==> 4
jshell> list
list ==> [[1] [[2] [[3] [[4] ?]]]]


```

You can test your code by running the `Test5.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.

```bash
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test5.java
$ java Test5
```

## `reduce` and `count`

Finally, we are going to implement the terminal operations: `count` and `reduce`.  To imitate `java.util.stream.Stream`, the `count` method should return a `long`.

Note: In Java, any integral value with the suffix `L` is treated as a `long` value.  For instance, `123` has the type `int`, but `123L` has the type `long`.

```Java
jshell> import cs2030s.fp.InfiniteList;

jshell> InfiniteList.<Integer>sentinel().reduce(0, (x, y) -> x + y)
$.. ==> 0
jshell> InfiniteList.iterate(0, x -> x + 1).limit(5).reduce(0, (x, y) -> x + y)
$.. ==> 10
jshell> InfiniteList.iterate(0, x -> x + 1).limit(0).reduce(0, (x, y) -> x + y)
$.. ==> 0
jshell> InfiniteList.iterate(1, x -> x + 1).map(x -> x * x).limit(5).reduce(1, (x, y) -> x * y)
$.. ==> 14400

jshell> InfiniteList.<Integer>sentinel().count()
$.. ==> 0
jshell> InfiniteList.iterate(0, x -> x + 1).limit(0).count()
$.. ==> 0
jshell> InfiniteList.iterate(0, x -> x + 1).limit(1).count()
$.. ==> 1

jshell> InfiniteList.iterate(0, x -> x + 1).filter(x -> x % 2 == 1).limit(10).count()
$.. ==> 10
jshell> InfiniteList.iterate(0, x -> x + 1).limit(10).filter(x -> x % 2 == 1).count()
$.. ==> 5
jshell> InfiniteList.iterate(0, x -> x + 1).takeWhile(x -> x < 10).count()
$.. ==> 10
jshell> InfiniteList.iterate(0, x -> x + 1).takeWhile(x -> x < 10).filter(x -> x % 2 == 0).count()
$.. ==> 5
```

You can test your code by running the `Test6.java` provided.  The following should compile without errors or warnings.  Make sure your code follows the CS2030S Java style and can generate the documentation without error.

```bash
$ javac -Xlint:rawtypes cs2030s/fp/*java
$ javac -Xlint:rawtypes Test6.java
$ java Test6
```

## Following CS2030S Style Guide

You should make sure that your code follows the [given Java style guide](https://nus-cs2030s.github.io/2425-s2/style.html).

```
$ java -jar ~cs2030s/bin/checkstyle.jar -c checkstyle.xml cs2030s/fp/InfiniteList.java
```
