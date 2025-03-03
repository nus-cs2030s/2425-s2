# Past Year PE2 Question: Circle and Point

### Adapted from PE2 of 20/22 Semester 2

## Instructions to Past-Year PE2 Question:

1. Accept the repo on GitHub Classroom [here](https://classroom.github.com/a/TGiE9pXd)
2. Log into the PE nodes and run `~cs2030s/get py2` to get the skeleton for all available past year PE1 questions.
3. The skeleton for this question can be found under `2021-s2-q2`.  You should see the following files:
    - The files `Test1.java` and `CS2030STest.java` for testing your solution.
    - The skeleton `Main.java` to write your solution in.


# Streams

## Your Task

There are four parts to this question, that may or may not be dependent on each other. You will need to write four single-line `Stream` pipelines to generate certain `Stream`s and solve certain computations. The last part of this question will get you to re-solve Exercise 0 (Pi Estimation) using only a `Stream` and some supporting classes.

The Stream API is included in the file `StreamAPI.md`.

You are provided with a `Point`, `Circle`, and `Main` class. These `Point`, and `Circle` classes are similar to those used in Lab 0.  Take a look at them to see what are the methods available.

All of your single-line pipelines will be written in the `Main.java` skeleton file. Each method body must contain only a single return statement.

## Implement the `pointStream` method.

The method `pointStream` has two arguments: `point` of type `Point` and `f` of type `Function<Point,Point>`.  Recall that `Function` is the Java equivalent of our `Transformer` functional interface which has the single abstract method `apply` instead of `transform`.  The method should return a `Stream<Point>` which contains the point `p`, followed by `f(p)`, and then `f(f(p))`, and so on.  Implement this method body using a single stream pipeline.

Some examples of use are shown below:

```
jshell> pointStream(new Point(0, 0), p -> new Point(p.getX(), p.getY() + 1)).limit(3).forEach(System.out::println)
(0.0, 0.0)
(0.0, 1.0)
(0.0, 2.0)

jshell> pointStream(new Point(0, 0), p -> new Point(p.getX() + 1, p.getY())).limit(3).forEach(System.out::println)
(0.0, 0.0)
(1.0, 0.0)
(2.0, 0.0)

jshell> pointStream(new Point(0, 0), p -> new Point(p.getX() + 1, p.getY() + 1)).limit(3).forEach(System.out::println)
(0.0, 0.0)
(1.0, 1.0)
(2.0, 2.0)
```

You can test your code by running the `Test1.java` provided.  Make sure your code follows the CS2030S Java style.

```
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Main.java
```

## Implement the `generateGrid` method.

The method `generateGrid` has two arguments: `point` of type `Point` and `n` which is of type `int`. This method should return a finite stream of type `Stream<Point>` containing the `n * n` points that define a grid starting from the point `point` and then incrementing both `x` and `y` coordinates by one. For example: a grid of size `3` starting from a point `(0,0)` should look like the following:
```
(0,0) (0,1) (0,2)
(1,0) (1,1) (1,2)
(2,0) (2,1) (2,2)
```

When in the stream they should appear in the order of the row first i.e. `(0,0) (0,1) (0,2) (1,0) (1,1) (1,2) (2,0) (2,1) (2,2)`. 

Implement this method body using a single stream pipeline.

Some examples of use are shown below:
```
jshell> generateGrid(new Point(0, 0), 2).forEach(System.out::println)
(0.0, 0.0)
(0.0, 1.0)
(1.0, 0.0)
(1.0, 1.0)

jshell> generateGrid(new Point(0, 0), 3).forEach(System.out::println)
(0.0, 0.0)
(0.0, 1.0)
(0.0, 2.0)
(1.0, 0.0)
(1.0, 1.0)
(1.0, 2.0)
(2.0, 0.0)
(2.0, 1.0)
(2.0, 2.0)

jshell> generateGrid(new Point(-1, 0), 2).forEach(System.out::println)
(-1.0, 0.0)
(-1.0, 1.0)
(0.0, 0.0)
(0.0, 1.0)
```

You can test your code by running the `Test1.java` provided.  Make sure your code follows the CS2030S Java style.

```
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Main.java
```

## Implement the `concentricCircles` method.

The method `concentricCircles` has two arguments: `circle` of type `Circle` and `f` which is of type `Function<Double,Double>`.  The method should return a `Stream<Circle>` which contains the first circle `circle`, followed by the circle with a radius given by `f(circle.getRadius())`, and then `f(f(circle.getRadius())`, and so on. In this way, we will have a stream of concentric circles (circles with a common center but with different radii - much like a target in archery).

Implement this method body using a single stream pipeline.

Some examples of use are shown below:
```
jshell> concentricCircles(new Circle(new Point(1, 1), 1.0),x -> x + 1).limit(3).forEach(System.out::println)
{ center: (1.0, 1.0), radius: 1.0 }
{ center: (1.0, 1.0), radius: 2.0 }
{ center: (1.0, 1.0), radius: 3.0 }

jshell> concentricCircles(new Circle(new Point(0, 0), 1.0),x -> x + 0.5).limit(3).forEach(System.out::println)
{ center: (0.0, 0.0), radius: 1.0 }
{ center: (0.0, 0.0), radius: 1.5 }
{ center: (0.0, 0.0), radius: 2.0 }
```

You can test your code by running the `Test1.java` provided.  Make sure your code follows the CS2030S Java style.

```
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Main.java
```

## Implement the `pointStreamFromCircle` method.

The method `pointStreamFromCircle` has one argument: `circles` of type `Stream<Circle>`. The method should return a `Stream<Point>` which contains the centers of all the circles in the `circles` list. Implement this method body using a single stream pipeline.

An example of use is shown below:
```
jshell> pointStreamFromCircle(Stream.of(new Circle(new Point(0, 0), 1), new Circle(new Point(1, 1), 2), new Circle(new Point(-1, -1), 1))).forEach(System.out::println)
(0.0, 0.0)
(1.0, 1.0)
(-1.0, -1.0)
```

You can test your code by running the `Test1.java` provided.  Make sure your code follows the CS2030S Java style.

```
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Main.java
```

## Estimating Pi using Monte Carlo Method

As in Exercise 0, we will use the Monte Carlo method for estimating the value of $\pi$. We have a square of width $2r$, and within it, a circle with a radius of $r$.

We randomly generate k points within the square.  We count how many points fall within the circle.  Suppose $n$ points out of $k$ fall within the circle.

Since the area of the square is $4r^2$ and the area of the circle is pi $r^2$, the ratio between them is $\pi/4$.  The ratio $n/k$ should therefore be $\pi/4$, and $\pi$ can be estimated as $4n/k$.

## `RandomPoint`

`RandomPoint` is a subclass of `Point` that represents a randomly generated point.  The random number generator that generates a random point has a default seed of 1.  There is a public method `setSeed()` that we can use to update the seed.

This is how it can be used.

To generate a new point,
```
Point p = new RandomPoint(minX, maxX, minY, maxY);
```

`minX`, `minY`, `maxX`, `maxY` represent the minimum and maximum possible x and y values respectively, for each randomly generated point.

To set the random seed,
```
RandomPoint.setSeed(10);
```

## Implement the `estimatePi` method.

You will now implement an `estimatePi` method using a single stream pipeline. `estimatePi` takes in three arguments, `circle` of type `Circle` , `supplier` of type `Supplier<RandomPoint>` (`Supplier` is the Java equivalent for `Producer`) and `k` of type int. The method should return an estimate of pi as a `double`, using the monte carlo method by generating `k` `RandomPoint`s.

Hint: the `contains` method in `Circle` might come in handy.

Some examples of its use:

```
jshell> RandomPoint.setSeed(10);
jshell> Circle c = new Circle(new Point(0.5, 0.5), 0.5)
jshell> estimatePi(c, () -> new RandomPoint(0, 1, 0, 1), 10000)
$.. ==> 3.1284
jshell> RandomPoint.setSeed(55);
jshell> estimatePi(c, () -> new RandomPoint(0, 1, 0, 1), 10000)
$.. ==> 3.1216
```
