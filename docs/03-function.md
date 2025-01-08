# Unit 3: Functions

!!! abstract "Learning Objectives"

    After this unit, students should

    - understand the importance of function as a programming construct and how it helps to reduce complexity and mitigate bugs.
    - be aware of two different roles a programmer can play: the implementer and the client.
    - understand the concept of abstraction barrier as a wall between the client and the implementer, including in the context of a function.

## Function as an Abstraction over Computation

Another important abstraction provided by a programming language is _function_ (also known as _method_ or _procedure_).  This abstraction allows programmers to group a set of instructions and give it a name.  The named set of instructions may take one or more variables as input parameters, and return zero or one values.

Like all other abstractions, defining functions allows us to think at a higher conceptual level.  By composing functions at increasingly higher levels of abstraction, we can build programs with increasing levels of complexity.

### Defining a Function in Java 

Let's look at how we can define a function (or _method_ in Java terminology) in Java.  Note that the Java examples below are not complete programs and are merely snippets.  As such, they cannot be compiled.  But, we can type them into JShell to interpret and execute them.

The basic syntax of a function is as follows:

```Java title="Syntax of a Java Function"
return_type function_name(param_type1 param1, param_type2 param2) {
  function body
}
```

For example, the following function is named `factorial`.  It takes in a parameter `n` of type  `int` and returns a result of type `int`.

```Java title="Simple Java Function"
int factorial(int n) {
  if (n == 0) {
    return 1;
  } 
  return n * factorial(n - 1);
}
```

Note that the return type is not optional.  If the function does not return anything, we use the type called `void`[^1].  Note that, unlike Python, Java does not allow returning more than one value.

[^1]: `void` in Java is like a true nothingness (unlike Python's `None` or JavaScript's `undefined`).  If a function is declared as returning a type `void`, it cannot even be used in an assignment!

## Reducing Code Complexity With Function

Functions help us deal with complexity in a few ways.

* Functions allow programmers to compartmentalize computation and its effects.  We can isolate the complexity within its body: the intermediate variables exist only as local variables that have no effect outside of the function.  A function only interacts with the rest of the code through its parameters and return value, and so, reduces the dependencies between variables to these well-defined interactions.  Such compartmentalization reduces the complexity of code.

* Functions allow programmers to hide _how_ a task is performed.  The caller of the function only needs to worry about _what_ the function does.  By hiding the details of _how_, we gain two weapons against code complexity.  First, we reduce the amount of information that we need to communicate among programmers.  A fellow programmer only needs to read the documentation to understand what the parameters are for, and what the return values are.  There is no need for a fellow programmer to know about the intermediate variables or the internal computation used to implement the functions.  Second, as the design and requirements evolve, the implementation of a function may change.  But, as long as the parameters and the return value of a function remain the same, the caller of the function does not have to update the code accordingly.  Reducing the need to change as the software evolves reduces the chances of introducing bugs accordingly.

* Functions allow us to reduce repetition in our code through _code reuse_.  If we have the same computation that we need to perform repeatedly on different _values_, we can construct these computations as functions by replacing the values with parameters and passing in the values as arguments to the function.  This approach reduces the amount of boiler-plate code and has two major benefits in reducing code complexity and bugs.  First, it makes the code more succinct, and therefore easier to read and understand.  Second, it reduces the number of places in our code that we need to modify as the software evolves, and therefore, decreases the chance of introducing new bugs.

Consider the example function below, which approximates $e^n$ using a Taylor series.

```Java title="A Function to Estimate e^n"
double exp(int n) { 
  double x = 1;
  double res = 0;
  for (int i = 0; i < 10; i += 1) {
    res += (x/factorial(i));
    x *= n;
  }
  return res;
}
```

The computation above involves three intermediate variables, `i`, `x` and `res`.  These variables are local to the function and are not exposed to the caller of the function.  Thus, the caller has three less variables to keep track of and worry about.  The caller of the function does not know how the estimation was done -- Does it use a `for` loop or a `while` loop?   Does it calculate it recursively? How many terms in the Taylor's series are used, etc.  The caller only needs to know that the function `exp` takes an integer `n` as input and returns a `double` as output.  Finally, every time we need to estimate $e^n$, we can call the function `exp` with the value of `n` as an argument, without repeatedly writing the same loop.  You can also see that `exp` reuses the function `factorial` that we defined earlier.

## Abstraction Barrier

We can imagine an _abstraction barrier_ between the code that calls a function and the code that defines the function body.  Above the barrier, the concern is about _what_ task a function performs, while below the barrier, the concern is about _how_ the function performs the task.

While many of you are used to writing a program solo, in practice, you rarely write a program with contributions from only a single person.  The abstraction barrier separates the role of the programmer into two: (i) an _implementer_, who provides the implementation of the function, and (ii) a _client_, who uses the function to perform the task.  Part of the aim of CS2030/S is to switch your mindset into thinking in terms of these two roles.  In fact, in CS2030/S, you will be both but may be restricted to just being either a client or an implementer on specific functionality.

The abstraction barrier thus enforces a _separation of concerns_ between the two roles.  The client does not have to care how the implementer implements the functionality.  This gives the implementer the freedom and flexibility to change how the function is implemented, without affecting the client, as long as the behavior of the function remains unchanged.  Similarly, the implementer does not have to care how the client is using the functionality as long as the client is following the specification of the functionality.

The concept of abstraction barrier applies not only to a function but it can be applied to different levels of abstraction as well.  We will see how it is used for a higher level of abstraction in the next unit.
