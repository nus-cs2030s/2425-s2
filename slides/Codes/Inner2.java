class A {
  private int x = 0;
  static int y;
  
  class B {
    private int x = 1;
    void foo() {
      x = 2;
    }
  } // Qns: Which of the above is OK?
  
  public void fooB() {
    B b = new B();
    b.foo();
    System.out.println(x);
  }
}
class Main {
  public static void main(String[] args) {
    A a = new A();
    a.fooB();
  }
}