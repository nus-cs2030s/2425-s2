final class Point {
  private final double x;
  private final double y;

  public Point(double x, double y) {
    this.x = x;
    this.y = y;
  }

  public Point moveTo(double x, double y) {
    Point pt = new Point(x, y);
    return pt;
  }

  @Override
  public String toString() {
    return "(" + this.x + ", " + this.y + ")";
  }
}