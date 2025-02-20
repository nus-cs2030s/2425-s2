# Past Year PE2 Question: Either

### Adapted from PE2 of 21/22 Semester 2

## Instructions to Past-Year PE2 Question:

1. Accept the repo on GitHub Classroom [here](https://classroom.github.com/a/TGiE9pXd)
2. Log into the PE nodes and run `~cs2030s/get py2` to get the skeleton for all available past year PE1 questions.
3. The skeleton for this question can be found under `2122-s2-q1`.  You should see the following files:
    - The files `Test1.java`, `Test2.java`, and `CS2030STest.java` for testing your solution.

## Motivation

In languages such as Javascript, we can write functions or methods such as
```
function foo(x) {
  if (x == 0) {
    return "zero"; 
  }
  return 1; 
}
```
where the return value can be either a string or an integer.  In Java, however, the return value of a method can only be of a single type.  We cannot write the code equivalent to the example above as we are forced to choose either to return a `String` or return an `int`.

To get around this limitation, other strongly typed languages such as Scala provides a monad called `Either` that can encapsulate a value where the type is one of two possibilities.  Java does not provide this abstraction, so you will build one in this question.

Write an abstract class `Either<L, R>` that encapsulates two possible results of computation with possible differing types `L` and `R` in the package `cs2030s.fp`.  We refer to these two possibilities as `left` and `right` respectively.  One of these possibilities must be true -- i.e., we are guaranteed that there is always a value encapsulated.
 
We can now rewrite the code above into Java using `Either` monad
```Java
Either<String, Integer> foo(int x) {
  if (x == 0) {
    return Either.left("zero");
  }
  return Either.right(1);
}
```

## Your Task

We break down the tasks you need to do into two sections.  We suggest that you read through the whole question, and plan your solution carefully before starting.  

## The Basics

First, please implement the following methods:

- the `left` factory method, which allows us to create a left, i.e., a new `Either` monad with a left value. 
- the `right` factory method, which allows us to create a right, i.e., a new `Either` monad with a right value. 
- `isLeft()`, which will return the value true if the `Either` is a left, false otherwise.
- `isRight()`, which will return the value true if the `Either` is a right, false otherwise.
- `getLeft()`, which will return the value if it is a `left` and throw a `NoSuchElementException` otherwise.
- `getRight()`, which will return the value if it is a `right` and throw a `NoSuchElementException` otherwise.

and overrides the following methods from `Object`: 
- `equals(Object o)`, which will return the true if two `either` are equals; false otherwise.  Two `Either` are equals if (i) either they are both left or both right; and (ii) the value contained inside are equals.
- `toString()`, which will return a string of the pattern "Left[...]" if it is a left, or the pattern "Right[...]" if it is a right, with ... replaced with the string representation of the corresponding value stored inside the `Either`.

The `NoSuchElementException` can be found in the package `java.util`.

Study carefully how these methods can be used in the examples below:
```
jshell> import cs2030s.fp.Either;
jshell> // Expect error
jshell> new Either<>()
|  Error:
|  cs2030s.fp.Either is abstract; cannot be instantiated
|  new Either<>()
|  ^------------^

jshell> Either.right("two").isLeft() 
$.. ==> false
jshell> Either.right("two").isRight() 
$.. ==> true
jshell> Either.right("two").getRight() 
$.. ==> "two"
jshell> Either.left(2).isLeft() 
$.. ==> true
jshell> Either.left(2).isRight()
$.. ==> false
jshell> Either.left(2).getLeft()
$.. ==> 2

jshell> // Expect NoSuchElementException
jshell> Either.left(2).getRight()
|  Exception java.util.NoSuchElementException
|        at Either$Left.getRight (Either.java:94)
|        at (#8:1)
jshell> Either.right("two").getLeft()
|  Exception java.util.NoSuchElementException
|        at Either$Right.getLeft (Either.java:167)
|        at (#9:1)

jshell> // Compilation error due to type mismatch
jshell> Either<String, Integer> e = Either.left(2)
|  Error:
|  incompatible types: inference variable L has incompatible bounds
|      equality constraints: java.lang.String
|      lower bounds: java.lang.Integer
|  Either<String, Integer> e = Either.left(2);
|                              ^------------^
jshell> Either<Double, Long> e = Either.right(true)
|  Error:
|  incompatible types: inference variable R has incompatible bounds
|      equality constraints: java.lang.Long
|      lower bounds: java.lang.Boolean
|  Either<Double, Long> e = Either.right(true);
|                           ^----------------^

jshell> String two = new String("two")
jshell> Either.right(two).equals(Either.right("two"))
$.. ==> true
jshell> Either.right(two).equals(Either.left("two"))
$.. ==> false
jshell> Either.left(two).equals(Either.right("two"))
$.. ==> false
jshell> Either.left(two).equals(Either.left("two"))
$.. ==> true
jshell> Either.right(two).equals(Either.right(2))
$.. ==> false
jshell> Either.left(two).equals(Either.left(2))
$.. ==> false
jshell> Either.left(null).equals(Either.left(null))
$.. ==> true
jshell> Either.right(null).equals(Either.right(null))
$.. ==> true

jshell> Either.right(20).toString()
$.. ==> "Right[20]"
jshell> Either.left("thirty").toString()
$.. ==> "Left[thirty]"
```

You can also test your code with `Test1.java`:
```
$ javac cs2030s/fp/Either.java
$ javac Test1.java
$ java Test1
$ java -jar checkstyle.jar -c cs2030_checks.xml cs2030s/fp/Either.java
```

## map 

Implement the `map` method which takes in two `Transformer`s so that they can be applied computation on the content of `Either`.  If `map` is called on an `Either` instance that is a `left` it will apply the left `Transformer`, and if it is a `right` it will apply the right `Transformer`.

## flatMap 

Implement the `flatMap` method that takes in two `Transformer`s so that we can compose multiple methods that produce a `Either` together.  If `flatMap` is called on a left, it will apply the left transformer. Otherwise it will apply the right transformer.

## fold

Implement the `fold` method which takes in two `Transformer`s and folds the two possible types into a common type. That is, if this is an `Either<Integer, Double>` and your want to fold it into a `String` your left and right `Transformer`s need to map to `String`.
If `fold` is called on a left, it will apply the left transformer. Otherwise it will apply the right transformer.

## filterOrElse

The method `filterOrElse` takes in two arguments, a `BooleanCondition` and a `Transformer`. This method will behave differently dependent on whether the value is a right or a left. Is a value if a right, it will check if the the given `BooleanCondition` holds for the right value, if it is, it will return the right unchanged. It the predicate does not hold it will return a left with the value from applying the given tranformer to the right value.  If it is a left it will only return the left unchanged.

Study carefully how `map`, `flatMap`, `fold`, and `filterOrElse` can be used in the examples below:
```
jshell> import cs2030s.fp.Either;
jshell> import cs2030s.fp.BooleanCondition;
jshell> import cs2030s.fp.Transformer;
jshell> Either.<Integer, String>left(2).map(i -> i + 2, s -> s + " + 2")
$.. ==> Left[4]
jshell> Either.<Integer, String>right("2").map(i -> i + 2, s -> s + " + 2")
$.. ==> Right[2 + 2]

jshell> Transformer<Object, Integer> hash = o -> o.hashCode();
jshell> Either<Number, Number> enn = Either.left(2).map(hash, hash);
jshell> Either<Number, Number> enn = Either.right(2).map(hash, hash);

jshell> Either.<Integer, String>left(2).flatMap(i -> Either.left(i + 2), s -> Either.right(s + " + 2"));
$.. ==> Left[4]
jshell> Either.<Integer, String>right("2").flatMap(i -> Either.left(i + 2), s -> Either.right(s + " + 2"));
$.. ==> Right[2 + 2]

jshell> Transformer<Object, Either<String, Integer>> strOrHash;
jshell> strOrHash = o -> (o.equals(8) ? 
   ...>     Either.<String, Integer>left(o.toString()) : 
   ...>     Either.<String, Integer>right(o.hashCode()));
jshell> Either<Object, Number> enn = Either.left(2).flatMap(strOrHash, strOrHash);
jshell> Either<Object, Number> enn = Either.left(8).flatMap(strOrHash, strOrHash);
jshell> Either<Object, Number> enn = Either.right(2).flatMap(strOrHash, strOrHash);
jshell> Either<Object, Number> enn = Either.right(8).flatMap(strOrHash, strOrHash);

jshell> Either.<List<Integer>, String>left(List.of(1,2,3)).fold(l -> l.size(), s -> s.length());
$.. ==> 3
jshell> Either.<List<Integer>, String>right("hello there").fold(l -> l.size(), s -> s.length());
$.. ==> 11
jshell> Either.<List<Integer>, String>left(List.of(1,2,3)).<Number>fold(hash, hash);
$.. ==> 30817
jshell> Either.<List<Integer>, String>right("hello there").<Number>fold(hash, hash);
$.. ==> 1791114646

jshell> Either.<String, Boolean>left("no change").filterOrElse(x -> x == true, x -> "");
$.. ==> Left[no change]
jshell> Either.<String, Boolean>right(true).filterOrElse(x -> x == true, x -> "is false");
$.. ==> Right[true]
jshell> Either.<String, Boolean>right(false).filterOrElse(x -> x == true, x -> "is false");
$.. ==> Left[is false]

jshell> Transformer<Object, Exception> toException = o -> new IllegalStateException(o + " is illegal");
jshell> BooleanCondition<Number> isPositive = n -> n.intValue() > 0;
jshell> Either.<Throwable, Integer>left(new IllegalStateException()).filterOrElse(isPositive, toException);
$.. ==> Left[java.lang.IllegalStateException]
jshell> Either.<Throwable, Integer>right(0).filterOrElse(isPositive, toException);
$.. ==> Left[java.lang.IllegalStateException: 0 is illegal]
jshell> Either.<Throwable, Integer>right(8).filterOrElse(isPositive, toException);
$.. ==> Right[8]

```

You can also test your code with `Test2.java`:
```
$ javac cs2030s/fp/Either.java
$ javac Test2.java
$ java Test2
$ java -jar checkstyle.jar -c cs2030_checks.xml cs2030s/fp/Either.java
```
