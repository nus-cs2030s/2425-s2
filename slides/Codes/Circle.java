class Circle {
  private Point c;
  private double r;

  public Circle(Point c, double r) {
    this.c = c;
    this.r = r;
  }

  public Circle moveTo(double x, double y) {
    return new Circle(c.moveTo(x, y), r);
  }

  @Override
  public String toString() {
    return this.c.toString()+": "+this.r;
  }
}
