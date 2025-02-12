# Exercise 3: Simulation 3

- Deadline: 18 February 2025, Tuesday, 12:01 SGT

## Prerequisite:

- Completed Exercise 2
- Caught up to Unit 25 of Lecture Notes
- Familiar with CS2030S Java style guide

## Goal

This is a continuation of Exercise 2.  Exercise 3 extends some of the requirements of Exercise 2 and adds new entities to the world that we are simulating.  The goal is to demonstrate that, when OO principles are applied properly, we can adapt our code to changes in the requirements with less effort.

Lab 3 also involves writing your generic classes.

### Extension 1: Queueing at The Counters

The Bank has now decided to streamline its operations.  It rearranges the layout and makes some space for queues at the counters.  With that, customers can now wait at individual counters.

In this lab, we will modify the simulation to add a counter queue to each counter.  

The maximum queue length for each counter queue is $l$. All counter queues are independent.  Recall from Exercise 2 that the maximum queue length for the entrance queue is denoted as $m$.  $m$ and $l$ may be different.

When a customer arrives, a few scenarios could happen:

- If more than one counter is available, a customer will go to the counter with the smallest id (just like in Exercise 2) 
- If none of the counters is available, but at least one of the counter queues is not full, the customer will join the counter with the shortest queue.  If there are two counters with the same queue length, we break ties by going to the counter with the smaller id.
- If every counter queue has reached its maximum capacity of $l$, but the entrance queue is not full, then the customer will join the entrance queue.   
- If every counter queue has reached its maximum capacity of $l$, and the entrance queue has reached its maximum capacity of $m$, then the customer will leave.

When a counter is done serving a customer and becomes available, the customer at the front of its counter queue will proceed to the counter for service.  This event frees up a slot in the counter queue.  One customer from the entrance queue may join the counter queue of that counter.  It takes 0.01 time unit for a customer to move from the entrance queue to the counter queue.

Note that, the entrance queue is empty unless all counters queues have reached the maximum length.  Furthermore, a counter cannot "steal" a customer from another counter queue.  Once a customer joins a counter queue, it cannot switch to another counter queue.

### Extension 2: Withdrawal and Depositing Money

Recall that every customer comes into the bank with one of two tasks: withdrawal or deposit.  In Exercise 3, we now simulate the following:

- Every customer arrives with a task to withdraw or deposit some amount of money.
- Every counter starts with an initial amount of money: $100.
- Each time a counter {++starts servicing++} a customer, the amount of money at that counter may increase or decrease.   If the customer is withdrawing \$$x$, the amount of money at that counter decreases by $x$.  If the customer is depositing \$$x$, the amount of money at that counter increases by $x$.
- A counter may not have enough money for withdrawal.  If a customer wishes to withdraw more money than what is available at the counter, the withdrawal will fail.  The amount of money at the counter does not change in this case.

### Changes to Input

1. There is an additional input parameter, an integer $l$, indicating the maximum allowed length of the counter queue.  This input parameter should be read immediately _after_ reading the number of bank counters and _before_ the maximum allowed length of the entrance queue.

2. There is an additional input parameter at the end of each line in the input file that indicates the amount of money the customer is withdrawing or depositing.  The new parameter is a positive integer.

### Changes to Output

1. We now have two types of queues.  If a customer joins the entrance queue, the customer along with the queue _before_ joining should be printed as such:
```
1.400: C3 joins bank queue [ C1 C2 ]
```

2. Whenever we print a counter, we print the amount of money it has along with its counter queue.
```
1.200: C2 joins counter queue (at S0 $124 [ C1 ])
```

3. Whenever we print a task, we print the amount of money associated with the task.
```
6.000: C6 withdrawal $1 (at S0 $100 [ C9 ])
```

4. If a service is done successfully, `success` is printed.  But if a service fails, i.e., when a customer wants to withdraw more money than what is available at the counter, `fail` is printed.
```
3.100: C1 withdrawal $80 (at S0 $110 [ ]) begins
5.100: C1 withdrawal $80 (at S0 $30 [ ]) ends: success
7.100: C2 withdrawal $50 (at S0 $30 [ ]) ends: fail
```

## Skeleton for Exercise 3

We provide two classes for Exercise 3, the main `Ex3.java` (which is simply `Ex2.java` renamed) and `Seq.java`. You should not edit `Ex3.java` but you need to fill in the blanks for `Seq.java` as described below.

We also provide three new classes for testing: `CS2030STest.java` (which you should be familiar with from Exercise 0), `SeqTest.java`, and `QueueTest.java`.  You should not edit these test files.

### Building Upon Exercise 2.

You are required to build on top of your Exercise 2 submission for this lab.

Assuming you have `ex2-<username>` and `ex3-<username>` under the same directory, and `ex3-<username>` is your current working directory, you can run
```
cp -i ../ex2-<username>/*.java .
rm -i Ex2.java
```

to copy all your Java code over.

If you are still unfamiliar with Unix commands to navigate the file system and to manage your files, please review [our Unix guide](https://nus-cs2030s.github.io/2324-s2/unix/essentials.html).

You are encouraged to consider your tutor's feedback and fix any issues with your design for your Exercise 2 submission before you submit your Exercise 3.

## Your Tasks

You have a few tasks to complete for Exercise 3.  We suggest you solve this lab in the following order.

### 1. Make `Queue` a generic class

The class `Queue` given to you in Exercise 2 stores its elements as `Object` references, and therefore is not type-safe.  Now that you have learned about generics, you should update `Queue` to make it a generic class `Queue<T>`.

You are encouraged to test your `Queue<T>` in `jshell` yourself.  A sample test sequence is as follows:
```
jshell> /open Queue.java
jshell> Integer i;
jshell> String s;
jshell> boolean b;
jshell> Queue<Integer> q = new Queue<Integer>(2);
jshell> b = q.enq(4);
jshell> b
b ==> true
jshell> b = q.enq(8);
jshell> b
b ==> true
jshell> b = q.enq(0);
jshell> b
b ==> false
jshell> s = q.deq();
|  Error:
|  incompatible types: java.lang.Integer cannot be converted to java.lang.String
|  s = q.deq();
|      ^-----^
jshell> i = q.deq();
jshell> i
i ==> 4
jshell> i = q.deq();
jshell> i
i ==> 8
jshell> i = q.deq();
jshell> i
i ==> null
jshell> q.enq("hello");
|  Error:
|  incompatible types: java.lang.String cannot be converted to java.lang.Integer
|  q.enq("hello");
|        ^-----^
jshell> 
```

The file `QueueTest.java` helps to test your `Queue<T>` class.

```
javac -Xlint:rawtypes QueueTest.java
java QueueTest
```

### 2. Create a generic `Seq<T>` class

Let's call the class that encapsulates the counter `BankCounter` (you may name it differently).  We have been using an array to store the `BankCounter` objects. In Exercise 3, you should replace that with a generic wrapper around an array.  In other words, we want to replace `BankCounter[]` with `Seq<BankCounter>`.  You may build upon the `Seq<T>` class from the notes &mdash; [Unit 25](https://nus-cs2030s.github.io/2324-s2/25-unchecked.html).

The `Seq<T>` class you build must support the following:

- `Seq<T>` takes in only a subtype of `Comparable<T>` as its type argument.  That is, we want to parameterize `Seq<T>` with only a `T` that can compare with itself. Note that in implementing `Seq<T>`, you will find another situation where using raw type is necessary.  You may, for this case, use `@SuppressWarnings("rawtypes")` at _the smallest scope possible_ to suppress the warning about raw types.

- `Seq<T>` must support the `min` method, with the following descriptor:
```
    T min()
```

`min` returns the minimum element (based on the order defined by the `compareTo` method of the `Comparable<T>` interface).

- `Seq<T>` supports a `toString` method.  The code has been given to you in `Seq.java`.

You are encouraged to test your `Seq<T>` in `jshell` yourself. A sample test sequence is as follows:

```
jshell> /open Seq.java
jshell> Integer i
jshell> String s
jshell> Seq<Integer> a;
jshell> a = new Seq<Integer>(4);
jshell> a.set(0, 3);
jshell> a.set(1, 6);
jshell> a.set(2, 4);
jshell> a.set(3, 1);
jshell> a.set(0, "huat");
|  Error:
|  incompatible types: java.lang.String cannot be converted to java.lang.Integer
|  a.set(0, "huat");
|           ^----^
jshell> i = a.get(0)
jshell> i
i ==> 3
jshell> i = a.get(1)
jshell> i
i ==> 6
jshell> i = a.get(2)
jshell> i
i ==> 4
jshell> i = a.get(3)
jshell> i
i ==> 1
jshell> s = a.get(0)
|  Error:
|  incompatible types: java.lang.Integer cannot be converted to java.lang.String
|  s = a.get(0)
|      ^------^
jshell> i = a.min()
jshell> i
i ==> 1
jshell> a.set(3,9);
jshell> i = a.min()
jshell> i
i ==> 3
jshell> // try something not comparable
jshell> class A {}
jshell> Seq<A> a;
|  Error:
|  type argument A is not within bounds of type-variable T
|  Seq<A> a;
|        ^
jshell> class A implements Comparable<Long> { public int compareTo(Long i) { return 0; } }
jshell> Seq<A> a;
|  Error:
|  type argument A is not within bounds of type-variable T
|  Seq<A> a;
|        ^
jshell> // try something comparable
jshell> class A implements Comparable<A> { public int compareTo(A a) { return 0; } }
jshell> Seq<A> a;
jshell> 
```

The file `SeqTest.java` helps to test your `Seq<T>` class.

```
javac -Xlint:unchecked -Xlint:rawtypes SeqTest.java
java SeqTest
```

### 3. Make Your `BankCounter` Comparable to Itself

Your class that encapsulates the bank counter must now implement the `Comparable<T>` interface so that it can compare with itself and it can be used as a type argument for `Seq<T>`.

You should implement `compareTo` in such a way that `counters.min()` returns the counter that a customer should join (unless all the counter queues have reached maximum length).

### 4. Update Your Simulation

By incorporating `Queue<T>`, `Seq<T>`, `BankCounter`, modify your simulation so that it implements the extensions and changes described above.


## Following CS2030S Style Guide

Like Exercise 2, you should also make sure that your code follows the [given Java style guide](https://nus-cs2030s.github.io/2324-s2/style.html)

## Assumptions

We assume that no two events involving two different customers ever occur at the same time (except when a customer departs and another customer begins its service, or when a customer is done and another customer joins the counter queue from the entrance queue).  As per all exercises, we assume that the input is correctly formatted.

## Compiling, Testing, and Debugging

### Compilation

To compile your code,
```
$ javac -Xlint:unchecked -Xlint:rawtypes *.java
```

To check for style,
```
$ java -jar ~cs2030s/bin/checkstyle.jar -c ex3_style.xml *.java
```

### Running and Testing

You may test your simulation code similarly to how you test your Exercise 2.

Note that test cases 1 to 10 set $l$ to 0, so there is no counter queue.  Test cases 11 and 12 set $l$ to non-zero and $m$ to 0, so there is no entrance queue.  Test cases 13 and 14 test scenarios with both entrance and counter queues.
