# Unit 39: Asynchronous Programming

!!! abstract "Learning Objectives"

    Students should

    - understand the limitation of thread
    - understand and be able to use `CompletableFuture`

## Limitations of `Thread`

Writing code directly with the `Thread` class gives us control on how many threads to create, what they do, how they communicate with each other, and some level of control on which thread gets executed when.  While Java's `Thread` is already a higher-level abstraction compared to, say, the `pthread` library in C and C++, it still takes a fair amount of effort to write complex multi-threaded programs in Java.

Consider the situation where we have a series of tasks that we wish to execute _concurrently_ and we want to organize them such that:

- Task A must start first.
- When Task A is done, we take the result from Task A, and pass it to Tasks B, C, and D.
- We want Task B and C to complete before we pass their results to Task E.  

We also want to handle exceptions gracefully &mdash; if one of the tasks encounters an exception, the other tasks not dependent on it should still be completed.

Implementing the above using `Thread` requires careful coordination.  Firstly, there are no methods in `Thread` that return a value.  We need the threads to communicate through shared variables.  Secondly, there is no mechanism to specify the execution order and dependencies among them &mdash; which thread to start after another thread completes.  Finally, we have to consider the possibility of exceptions in each of our tasks.

Another drawback of using `Thread` is its overhead &mdash; the creation of `Thread` instances takes up some resources in Java.  As much as possible, we should reuse our `Thread` instances to run multiple tasks.  For instance, the same `Thread` instance could have run Tasks A, B, and E in the example above.  Managing the `Thread` instances itself and deciding which `Thread` instance should run which `Thread` is a gigantic undertaking.

## A Higher-Level Abstraction

What we need is a higher-level abstraction that allows programmers to focus on specifying the tasks and their dependencies, without worrying about the details.  Suppose we want to run the tasks in a single thread, we could do the following:

```Java
int foo(int x) {
  int a = taskA(x);
  int b = taskB(a);
  int c = taskC(a);
  int d = taskD(a);
  int e = taskE(b, c)
  return e;
}
```

We could also use monads to chain up the computations.  Let's say that one of the tasks might not produce a value, then we can use the `Maybe<T>` monad:

```Java
Maybe<Integer> foo(int x) {
  Maybe<Integer> a = Maybe.of(taskA(x));
  Maybe<Integer> b = a.flatMap(i -> taskB(i));
  Maybe<Integer> c = a.flatMap(i -> taskC(i));
  Maybe<Integer> d = a.flatMap(i -> taskD(i));
  Maybe<Integer> e = b.combine(c, (i, j) -> taskE(i, j));
  return e;
}
```

If we want to perform the tasks lazily, then we can use the `Lazy<T>` monad:

```Java
Lazy<Integer> foo(int x) {
  Lazy<Integer> a = Lazy.of(taskA(x));
  Lazy<Integer> b = a.flatMap(i -> taskB(i));
  Lazy<Integer> c = a.flatMap(i -> taskC(i));
  Lazy<Integer> d = a.flatMap(i -> taskD(i));
  Lazy<Integer> e = b.combine(c, (i, j) -> taskE(i, j));
  return e;
}
```

Wouldn't it be nice if there is a monad that allows us to perform the tasks concurrently?  [`java.util.concurrent.CompletableFuture`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CompletableFuture.html) does just that!  Here is an example of how to use it:

```Java
CompletableFuture<Integer> foo(int x) {
  CompletableFuture<Integer> a = CompletableFuture.completedFuture(taskA(x));
  CompletableFuture<Integer> b = a.thenComposeAsync(i -> taskB(i));
  CompletableFuture<Integer> c = a.thenComposeAsync(i -> taskC(i));
  CompletableFuture<Integer> d = a.thenComposeAsync(i -> taskD(i));
  CompletableFuture<Integer> e = b.thenCombineAsync(c, (i, j) -> taskE(i, j));
  return e;
}
```

We can then run `foo(x).get()` to wait for all the concurrent tasks to complete and return us the value.  `CompletableFuture<T>` is a monad that encapsulates a value that is either there or not there _yet_.  Such an abstraction is also known as a promise in other languages (e.g., `Promise` in JavaScript and `std::promise` in C++)
-- it encapsulates the promise to produce a value.

## The `CompletableFuture` Monad

Let's now examine the `CompletableFuture` monad in more detail.  A key property of `CompletableFuture` is whether the value it promises is ready &mdash; i.e., the tasks that it encapsulates have been _completed_ or not.

### Creating a `CompletableFuture`

There are several ways we can create a `CompletableFuture<T>` instance:

- Use the `completedFuture` method.  This method is equivalent to creating a task that is already completed and return us a value.  
- Use the `runAsync` method that takes in a `Runnable` lambda expression.  `runAsync` has the return type of `CompletableFuture<Void>`.  The returned `CompletableFuture` instance completes when the given lambda expression finishes.
- Use the `supplyAsync` method that takes in a `Supplier<T>` lambda expression.  `supplyAsync` has the return type of `CompletableFuture<T>`.  The returned `CompletableFuture` instance completes when the given lambda expression finishes.

We can also create a `CompletableFuture` that relies on other `CompletableFuture` instances.  We can use `allOf` or `anyOf` methods for this.  Both of these methods take in a variable number of other `CompletableFuture` instances.  A new `CompletableFuture` created with `allOf` is completed only when all the given `CompletableFuture` completes.  On the other hand, a new `CompletableFuture` created with `anyOf` is completed when any one of the given `CompletableFuture` completes.

### Chaining `CompletableFuture`

The usefulness of `CompletableFuture` comes from the ability to chain them up and specify a sequence of computations to be run.  We have the following methods:

- `thenApply`, which is analogous to `map`
- `thenCompose`, which is analogous to `flatMap`
- `thenCombine`, which is analogous to `combine`

The methods above run the given lambda expression in the same thread as the caller.  There is also an asynchronous version (`thenApplyAsync`, `thenComposeAsync`, `thenCombineAsync`), which may cause the given lambda expression to run in a different thread (thus more concurrency).

`CompletableFuture` also has several methods that take in `Runnable`.  These methods have no analogy in our lab but it is similar to `runAsync` above.

- `thenRun` takes in a `Runnable`.  It executes the `Runnable` after the current stage is completed.
- `runAfterBoth` takes in another `CompletableFuture`[^1] and a `Runnable`.  It executes the `Runnable` after the current stage completes and the input `CompletableFuture` is completed.
- `runAfterEither` takes in another `CompletableFuture`[^1] and a `Runnable`.  It executes the `Runnable` after the current stage completes or the input `CompletableFuture` is completed.

All of the methods that take in `Runnable` return `CompletableFuture<Void>`.  Similarly, they also have the asynchronous version (`thenRunAsync`, `runAfterBothAsync`, `runAfterEitherAsync`).

[^1]: Actually, this is a `CompletionStage` which is a supertype of `CompletableFuture`.

### Getting The Result

After we have set up all the tasks to run asynchronously, we have to wait for them to complete.  We can call `get()` to get the result.  Since `get()` is a synchronous call, i.e., it blocks until the `CompletableFuture` completes, to maximize concurrency, we should only call `get()` as the final step in our code.

The method `CompletableFuture::get` throws a couple of checked exceptions: `InterruptedException` and `ExecutionException`, which we need to catch and handle.  The former refers to the exception that the thread has been interrupted, while the latter refers to errors/exceptions during execution.

An alternative to `get()` is `join()`.  `join()` behaves just like `get()` except that no checked exception is thrown.

### Example

Let's look at some examples.  Let's reuse our method that computes the i-th prime number.

```Java
int findIthPrime(int i) {
  return Stream
          .iterate(2, x -> x + 1)
          .filter(x -> isPrime(x))
          .limit(i)
          .reduce((x, y) -> y)
          .orElse(0);
}
```

Given two numbers i and j, we want to find the difference between the i-th prime number and the j-th prime number.  We can first do the following:

```Java
CompletableFuture<Integer> ith = CompletableFuture.supplyAsync(() -> findIthPrime(i));
CompletableFuture<Integer> jth = CompletableFuture.supplyAsync(() -> findIthPrime(j));
```

These calls would launch two concurrent threads to compute the i-th and the j-th primes.   The method calls `supplyAsync` returns immediately without waiting for `findIthPrime` to complete.

Next, we can say, that, when `ith` and `jth` are complete, take the value computed by them, and take the difference.  We can use the `thenCombine` method:
```Java
CompletableFuture<Integer> diff = ith.thenCombine(jth, (x, y) -> x - y);
```

This statement creates another `CompletableFuture` that runs asynchronously and computes the difference between the two prime numbers.  At this point, we can move on to run other tasks, or if we just want to wait until the result is ready, we call
```Java
diff.join();
```

to get the difference between the two primes[^2].

[^2]: There is repeated computation in primality checks between the two calls to `findIthPrime` here, which one could optimize.  We don't do that here to keep the example simple.

### Handling Exceptions

One of the advantages of using `CompletableFuture<T>` instead of `Thread` to handle concurrency is its ability to handle exceptions.  `CompletableFuture<T>` has three methods that deal with exceptions: `exceptionally`, `whenComplete`, and `handle`.   We will focus on `handle` since it is the most general.

Suppose we have a computation inside a `CompletableFuture<T>` that might throw an exception.  Since the computation is asynchronous and could run in a different thread, the question of which thread should catch and handle the exception arises.  `CompletableFuture<T>` keeps things simpler by storing the exception and passing it down the chain of calls, until `join()` is called.  `join()` might throw `CompletionException` and whoever calls `join()` will be responsible for handling this exception.  The `CompletionException` contains information on the original exception.

For instance, the code below would throw a `CompletionException` with a `NullPointerException` contained within it.

```Java
CompletableFuture.<Integer>supplyAsync(() -> null)
                 .thenApply(x -> x + 1)
                 .join();
```

Suppose we want to continue chaining our tasks despite exceptions.  We can use the `handle` method, to handle the exception.  The `handle` method takes in a `BiFunction` (similar to `cs2030s.fp.Combiner`).  The first parameter of the `BiFunction` is the value, the second is the exception, and the third is the return value.

Only one of the first two parameters is not `null`.  If the value is `null`, this means that an exception has been thrown.  Otherwise, the exception is `null`[^3].    

Here is a simple example where we use `handle` to replace a default value.
```Java
cf.thenApply(x -> x + 1)
  .handle((t, e) -> (e == null) ? t : 0)
  .join();
```

[^3]: This is another instance where Java uses `null` to indicate a missing value.  We can't use `null` as a legitimate value due to this flawed design.
