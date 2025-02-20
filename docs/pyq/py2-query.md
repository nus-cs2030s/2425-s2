# Practice PE2 Question: Query

### Adapted from PE2 of 21/22 Semester 2

## Instructions to grab Practice PE Question:

1. Accept the practice question [here](https://classroom.github.com/a/TGiE9pXd)
2. Log into the PE nodes and run `~cs2030s/get py2` to get the practice question.
3. There is no submission script

You should see the following in your home directory.
   
   - The files `Test1.java`, `Test2.java`, and `CS2030STest.java` for testing your solution.
   - The skeleton file for this question: `Query.java`.
   - The following files are also provided: `StreamAPI.md`

## Background

In computing, we commonly organize data into tables for processing.  In this question, we would like to explore how we can process and manipulate data stored in tables using Streams. 

Consider the following table of customer records from a store.   Each row of the table contains the name of a customer, and a list of purchases (identified by purchase ids, which are integers).

We will call this table the "Customer Table".

| Names                   | Purchase Ids |
|-------------------------|--------------|
| Michelle                | 12, 56       |
| Enzio                   | 34, 90       |
| Michael                 | 78           |

Each purchase has a cost.  The cost of each purchase is stored in another table called the "Sales Table".  Each row in this table contains a purchase id and the corresponding cost of the purchase.

| Purchase Ids | Cost |
|--------------|------|
| 12           | 12.0 |
| 34           | 6.0  |
| 56           | 7.5  |
| 78           | 9.0  |
| 90           | 17.0 |

In this question, we will implement these tables using `Map`. Recall that a `Map` is an abstraction over a set of (key, value) pairs. Each pair (key, value) is a `Map.Entry` stored in the `Map`.  Given a `Map.Entry`, we can retrieve the key with the `getKey()` method and retrieve the value with the `getValue()` method.

Treating each name as a key and the list of purchases as the value, the Customer Table can be represented as a `Map` from a `String` (Names) to a `List<Integer>` (Purchase Ids).

```
Map<String, List<Integer>> customerTable;
customerTable = Map.of(
    "Michelle", List.of(12, 56), 
    "Enzio",    List.of(34, 90), 
    "Michael",  List.of(78));
```

We can get the value of a `key` by using the `get` method.
```
customerTable.get("Michelle") // returns a List.of(12, 56)
```

Java `Map` provides methods to create a stream out of a `Map` entries, keys, and values.
```
customerTable.entrySet().stream() // returns a stream of `Map.Entry`
customerTable.keySet().stream()   // returns a stream of the Map keys
customerTable.values().stream()   // returns a stream of the Map values
```

Given the customers, list of their purchases, and the costs, we want to be able to build a table that maps between the name of the customer and the cost, as you can see below.

| Customer name | Cost |
|---------------|------|
| Michelle      | 12.0 |
| Michelle      | 7.5  |
| Enzio         | 6.0  |
| Enzio         | 17.0 |
| Michael       | 9.0  |

Our final goal is to sum up the total cost of all the purchases made by each customer, as demonstrated below.

| Customer name | Cost |
|---------------|------|
| Michelle      | 19.5 |
| Enzio         | 23.0 |
| Michael       | 9.0  |

## Your Task

In this question, you are to write five `Stream` methods to operate on the Customer and Sales tables. Each method should only contain a single Stream pipeline.  Nothing more.  No local variables or classes can be defined.

You may call the methods you create when solving other parts of this questions.

## getFilteredByKey

To get started, implement the `getFilteredByKey` methods. We have provided the skeleton for this first method in the `Query.java` file.

The `getFilteredByKey` takes in a table with type `Map<T, S>` and a predicate of type `Predicate<T>`.  It returns a stream of entries (or rows) with the type `Stream<Map.Entry<T, S>>`, containing only rows in the original table for which the key passes the predicate.

Note that you do not have to worry about PECS for this question.

Study carefully how this method can be used in the examples below:

```
jshell> /open Query.java
jshell> Map<String, List<Integer>> customerTable = Map.of(
   ...>     "Michelle", List.of(12, 56), 
   ...>     "Enzio",    List.of(34, 90), 
   ...>     "Michael",  List.of(78));
jshell> Query.getFilteredByKey(customerTable, x -> x.equals("Enzio")).forEach(System.out::println)
Enzio=[34, 90]
jshell> Query.getFilteredByKey(customerTable, x -> x.startsWith("Mic")).forEach(System.out::println)
Michelle=[12, 56]
Michael=[78]
jshell> Query.getFilteredByKey(customerTable, x -> x.startsWith("A")).forEach(System.out::println)
```

## getIdsFromName

We now write a method to get all of the purchase ids for a given customer name.  

Write the method `getIdsFromName` which takes in the Customer Table of type `Map<String, List<Integer>>` and a customer name (a `String`).  It returns a `Stream<Integer>` containng all purchase ids for the given customer name.  We can assume that there is at most one customer with the given name.

```
jshell> /open Query.java
jshell> Map<String, List<Integer>> customerTable = Map.of(
   ...>     "Michelle", List.of(12, 56), 
   ...>     "Enzio",    List.of(34, 90), 
   ...>     "Michael",  List.of(78));
jshell> Stream<Integer> purchaseIDs = Query.getIdsFromName(customerTable, "Michelle")
jshell> purchaseIDs.collect(Collectors.toList());
$.. ==> [12, 56]
jshell> Stream<Integer> purchaseIDs = Query.getIdsFromName(customerTable, "Sam")
jshell> purchaseIDs.collect(Collectors.toList());
$.. ==> []

```

## getCostsFromIDs

With the list of purchase IDs, we will now get the cost of each of these purchases.  Write the method `getCostsFromIDs` that takes a Sales Table (of type `Map<Integer, Double>`) and a list of purchase ids (of type `Stream<Integer>`), and returns the cost of each purchase as a `Stream<Double>`.  The costs returned must be in the same order as the corresponding purchase IDs.

Study carefully how these methods can be used in the examples below:
```
jshell> /open Query.java
jshell> Map<Integer, Double> salesTable = Map.of(
   ...>     12, 12.0,
   ...>     34, 6.0,
   ...>     56, 7.5,
   ...>     78, 9.0,
   ...>     90, 17.0)
jshell> Stream<Double> costs = Query.getCostsFromIDs(salesTable, Stream.of(12))
jshell> costs.collect(Collectors.toList());
$.. ==> [12.0]
jshell> Stream<Double> costs = Query.getCostsFromIDs(salesTable, Stream.of(12, 90))
jshell> costs.collect(Collectors.toList());
$.. ==> [12.0, 17.0]
jshell> Stream<Double> costs = Query.getCostsFromIDs(salesTable, Stream.of(7))
jshell> costs.collect(Collectors.toList());
$.. ==> []
```

You can also test your code with `Test1.java`:
```
$ javac Query.java
$ javac Test1.java
$ java Test1
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Query.java
```

## allCustomerCosts

We will now put the information retrieved from the two tables together, and create a new table showing, on each row, the name of each customer and the cost of each purchase by the customer.  

We will represent the output table as a `Stream<String>`, where every string in the stream is a row of the new table.

Write a method `allCustomerCosts` to do this.  The method takes in a "Customer Table" and a "Sales Table" and returns a `Stream<String>` representing the new table.  The order of the rows in the output does not matter.

Study carefully how this method can be used in the examples below:
```
jshell> /open Query.java
jshell> Map<String, List<Integer>> customerTable = Map.of(
   ...>     "Michelle", List.of(12, 56), 
   ...>     "Enzio",    List.of(34, 90), 
   ...>     "Michael",  List.of(78));
jshell> Map<Integer, Double> salesTable = Map.of(
   ...>     12, 12.0,
   ...>     34, 6.0,
   ...>     56, 7.5,
   ...>     78, 9.0,
   ...>     90, 17.0)
jshell> Map<String, List<Integer>> badCustomerTable = Map.of(
   ...>     "Bill", List.of(17),
   ...>     "Sam", List.of(19));
jshell> Map<Integer, Double> badSalesTable = Map.of(
   ...>     99, 3.0,
   ...>     98, 2.0);
jshell> Query.allCustomerCosts(customerTable, salesTable).forEach(System.out::println);
Michelle: 12.0
Michelle: 7.5
Michael: 9.0
Enzio: 6.0
Enzio: 17.0
jshell> Query.allCustomerCosts(customerTable, badSalesTable).forEach(System.out::println);
jshell> Query.allCustomerCosts(badCustomerTable, salesTable).forEach(System.out::println);

```

## totaledCustomerCosts

Finally, we will now create a new table to show the name of each customer and the total cost of the purchases by the customer.   
We will again represent the output table as a `Stream<String>`, where every string in the stream is a row of the table.

Write a method `totaledCustomerCosts` to do this.  The method takes in a "Customer Table" and a "Sales Table" and returns a `Stream<String>` representing the new table.  The order of the rows in the output does not matter.

Study carefully how this method can be used in the examples below:
```
jshell> /open Query.java
jshell> Map<String, List<Integer>> customerTable = Map.of(
   ...>     "Michelle", List.of(12, 56), 
   ...>     "Enzio",    List.of(34, 90), 
   ...>     "Michael",  List.of(78));
jshell> Map<Integer, Double> salesTable = Map.of(
   ...>     12, 12.0,
   ...>     34, 6.0,
   ...>     56, 7.5,
   ...>     78, 9.0,
   ...>     90, 17.0)
jshell> Map<String, List<Integer>> badCustomerTable = Map.of(
   ...>     "Bill", List.of(17),
   ...>     "Sam", List.of(19));
jshell> Map<Integer, Double> badSalesTable = Map.of(
   ...>     99, 3.0,
   ...>     98, 2.0);
jshell> Query.totaledCustomerCosts(customerTable, salesTable).forEach(System.out::println);
Michelle: 19.5
Michael: 9.0
Enzio: 23.0
jshell> Query.totaledCustomerCosts(customerTable, badSalesTable).forEach(System.out::println);
Michelle: 0.0
Michael: 0.0
Enzio: 0.0
jshell> Query.totaledCustomerCosts(badCustomerTable, badSalesTable).forEach(System.out::println);
Bill: 0.0
Sam: 0.0
```

You can also test your code with `Test2.java`:
```
$ javac Query.java
$ javac Test2.java
$ java Test2
$ java -jar ~cs2030s/bin/checkstyle.jar -c ~cs2030s/bin/cs2030_checks.xml Query.java
```
