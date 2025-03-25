# Unit 34: Streams in Java

!!! abstract "Learning Objectives"

    After this unit, students should understand:

    - how to use Java `Stream`.
    - the difference between Java `Stream` and `InfiniteList`.


## Java API

We have been building and using our own functional interfaces and abstractions. 

Java provides its own version of functional interfaces that are comparable to ours, in the `java.util.function` package.  The table below shows some commonly used ones:

| CS2030S                       | java.util.function                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BooleanCondition<T>::test`   | [`Predicate<T>::test`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Predicate.html#test&#40;T&#41;)           |
| `Producer<T>::produce`        | [`Supplier<T>::get`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html#get&#40;&#41;)                |
| `Consumer<T>::consume`        | [`Consumer<T>::accept`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Consumer.html#accept&#40;T&#41;)         |
| `Transformer<T, R>::transform` | [`Function<T, R>::apply`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Function.html#apply&#40;T&#41;)         |
| `Transformer<T, T>::transform` | [`UnaryOp<T>::apply`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/UnaryOperator.html)                        |
| `Combiner<S, T, R>::combine`    | [`BiFunction<S, T, R>::apply`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/BiFunction.html#apply&#40;T,U&#41;) |

Besides, some of the abstractions we have built have similar counterparts in Java as well:

| CS2030S               | Java version                                                                                                              |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------|
|`Box<T>`               | N/A                                                                                                                       |
|`Maybe<T>`             | [`java.util.Optional<T>`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)           |
|`Lazy<T>`              | N/A                                                                                                                       |
|`InfiniteList<T>`      | [`java.util.stream.Stream<T>`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html) |

We will focus this unit on `Stream` since the Java implementation of `Stream` is an infinite list with much more functionalities, some of which (such as parallel streams) are beyond what we can build ourselves in CS2030S.

## Building a Stream

To start, let's see how we can build a stream object:

- We can use the static factory method `of` (e.g., `Stream.of(1, 2, 3)`)
- We can use the `generate` and `iterate` methods (similar to our `InfiniteList`)
- We can convert an array into a `Stream` using `Arrays::stream`
- We can convert a `List` instance (or any `Collection` instance) into a `Stream` using `List::stream`

Many other APIs in Java return a `Stream` instance (e.g., `Files::lines`)

## Terminal Operations

A `Stream` is lazy, just like `InfiniteList`.

A terminal operation is an operation on the stream that triggers the evaluation of the stream.  A typical way of writing code that operates on streams is to chain a series of intermediate operations together, ending with a terminal operation.  

The `forEach` method is a terminal operation that takes in a stream and applies a lambda expression to each element.  
The lambda expression to apply does not return any value.  Java provides the [`Consumer<T>`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Consumer.html) functional interface for this.   Typical use is
```Java
Stream.of(1, 2, 3).forEach(System.out::println);
Stream.generate(() -> 1).forEach(System.out::println); // infinite loop
```

## Intermediate Stream Operations

An _intermediate_ operation on stream returns another `Stream`.  Java provides `map`, `filter`, `flatMap`, and other intermediate operations.  Intermediate operations are lazy and do not cause the stream to be evaluated.  

### FlatMapping a Stream

You have seen `flatMap` for `Box<T>`, `Maybe<T>` and `Lazy<T>`.  The method `flatMap` in `Stream` behaves similarly &mdash; it takes a lambda expression that transforms every element in the stream into another stream.  The resulting stream of streams is then flattened and concatenated together.  

For instance,
```Java
Stream.of("hello\nworld", "ciao\nmondo", "Bonjour\nle monde", "Hai\ndunia")
    .map(x -> x.lines()) // returns a stream of streams
```

```Java
Stream.of("hello\nworld", "ciao\nmondo", "Bonjour\nle monde", "Hai\ndunia")
    .flatMap(x -> x.lines()) // return a stream of strings
```

### Stateful and Bounded Operations

Some intermediate operations are stateful &mdash; they need to keep track of some states to operate.  Two examples are `sorted` and `distinct`.

`sorted` returns a stream with the elements in the stream sorted.  Without argument, it sorts according to the natural order as defined by implementing the `Comparable` interface.  You can also pass in a `Comparator` to tell `sorted` how to sort.

`distinct` returns a stream with only distinct elements in the stream. 

`distinct` and `sorted` are also known as `bounded` operations, since they should only be called on a finite stream &mdash; calling them on an infinite stream is a bad idea!

### Truncating an Infinite List

There are several intermediate operations that convert from infinite stream to finite stream: 

- `limit` takes in an `long` $n$ and returns a stream containing the first $n$ elements of the stream;
- `takeWhile` takes in a predicate and returns a stream containing the elements of the stream, until the predicate becomes false.  The resulting stream might still be infinite if the predicate never becomes false.

For instance, 

```Java
Stream.iterate(0, x -> x + 1).takeWhile(x -> x < 5); 
```

create a (lazy) finite stream of elements 0 to 4.

### Peeking with a `Consumer`

A particularly useful intermediate operation of `Stream` is `peek`.  `peek` takes in a `Consumer`, allowing us to apply a lambda on a "fork" of the stream.  For instance,

```Java
Stream.iterate(0, x -> x + 1).peek(System.out::println).takeWhile(x -> x < 5).forEach(x -> {});
```

### Reducing a Stream

One of the more powerful terminal operations in `Stream` is `reduce`, also known as `fold` or `accumulate` elsewhere, the `reduce` operation applies a lambda repeatedly on the elements of the stream to reduce it into a single value.  

For instance,
```Java
Stream.of(1, 2, 3).reduce(0, (x, y) -> x + y);
```
returns the sum of all elements in the stream.


The method `reduce` takes in an identity value (`0` in the example above) and an accumulation function (`(x, y) -> x + y` above) and returns the reduced value.  The process of reduction is equivalent to the following pseudocode:

```
result = identity
for each element in the stream
     result = accumulator.apply(result, element)
return result
```

Note that there are constraints on the identity and accumulation function, which are placed due to the potential parallelization of `reduce`.   We will revisit this operation later.

Java also overloaded `reduce` with two other versions &mdash; a simpler one (with `null` identity) and a more complex one, which supports a different returned type than the type of the elements in the stream.   You can read the [java API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html#reduce(T,java.util.function.BinaryOperator)) for details.

### Element Matching

Stream also provides terminal operations for testing if the elements pass a given predicate:

- `noneMatch` returns true if none of the elements pass the given predicate.
- `allMatch` returns true if every element passes the given predicate.
- `anyMatch` returns true if at least one element passes the given predicate.


## Consumed Once

One of the greatest limitations of `Stream`, which does not apply to our `InfiniteList`, is that a stream can only be operated once.  We cannot iterate through a stream multiple times.  Doing so would lead to an `IllegalStateException` being thrown.  We have to recreate the stream if we want to operate on the stream more than once.

Example,
```Java
Stream<Integer> s = Stream.of(1,2,3);
s.count();
s.count(); // <- error
```

## Example: Is this a prime?

Consider the method below, which checks if a given `int` is a prime:

```Java
boolean isPrime(int x) {
  for (int i = 2; i <= x-1; i++) {
    if (x % i == 0) {
      return false;
    }
  }
  return true;
}
```

Let's see how we can rewrite this with `Stream`.  Due to the overhead of wrapper classes, Java provides specialized streams on primitives: `IntStream`, `LongStream`, and `DoubleStream`, with a similar set of methods provided.  Since we are dealing with `int` here, we will use `IntStream`.  The code above can be rewritten as:

```Java
boolean isPrime(int x) {
  return IntStream.range(2, x)
      .noneMatch(i -> x % i == 0);
}
```

The `IntStream::range(x,y)` method generates a stream of `int` from `x` to `y-1`.

## Example: First 500 primes

What if we want to print out the first 500 prime numbers, starting from 2?  Normally, we would do the following:
```Java
void fiveHundredPrime() {
  int count = 0;
  int i = 2;
  while (count < 500) {
    if (isPrime(i)) {
      System.out.println(i);
      count++;
    }
    i++;
  }
}
```

The code is still considered simple, and understandable for many, but I am sure some of us will encounter a bug the first time we write this (either forgot to increment the counter or put the increment in the wrong place).  If you look at the code, there are a couple of components:

- Lines 3 and 9 deal with iterating through different numbers for primality testing
- Line 5 is the test of whether a number is prime
- Lines 2, 4, and 7, deal with limiting the output to 500 primes
- Line 6 is the action to perform on the prime

With streams, we can write it like the following:
```Java
IntStream.iterate(2, x -> x+1)
    .filter(x -> isPrime(x))
    .limit(500)
    .forEach(System.out::println);
```

Notice how each of the four components matches neatly with one operation on stream!  

With a stream, we no longer have to write loops, we have moved the iterations to within each operation in the stream.  We no longer need to maintain states and counters, they are done within each operation as needed as well.  This has another powerful implication: our code becomes more _declarative_, we only need to be concerned about what we want at each step, much less about how to do it.  Doing so makes our code more succinct and less bug-prone.

## Caution: Avoid Overusing Streams

We will end this unit with a note of caution.

Using stream in place of loops should make our code simpler, more elegant, and less bug-prone.  One should note that not all loops can be translated into stream elegantly.  A double-nested loop, for instance, stretches the elegance of streams.  A triple-nested loop should perhaps be best written as a loop with appropriate inner components written with lambdas and streams.

As you go through exercises in using streams, you will find more examples of the limitations of streams.
