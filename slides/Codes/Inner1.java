class A {
  private int x;
  static int y;

  class B {
    void foo() {
      x = 1;
      y = 1;
    }
  } // Qns: Which of the above is OK?
}
