package www.base

trait UIComponent extends Locator {
  lazy val name: String = this.getClass.getSimpleName.stripSuffix("$")
}
