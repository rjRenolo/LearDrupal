import type { Phase } from "./curriculum";

export const PHASE0: Phase = {
  id: 0,
  label: "Phase 0",
  name: "PHP Foundations",
  color: "#6bc44a",
  bg: "#14200d",
  weeks: [
    {
      label: "Week 1",
      name: "PHP OOP Essentials",
      days: [

        // ── Day 1 ────────────────────────────────────────────────
        {
          day: "Day 1",
          title: "Classes, Objects & Properties",
          goal: "Understand PHP classes and objects — the foundation of all Drupal module code.",
          reading: [
            { title: "Classes and objects", body: "A class is a blueprint. An object is an instance of that blueprint created with <code>new ClassName()</code>.", link: "https://www.php.net/manual/en/language.oop5.basic.php" },
            { title: "Property visibility", body: "<strong>public</strong> — anyone can access. <strong>protected</strong> — only the class and its subclasses. <strong>private</strong> — only the class itself. Drupal uses <code>protected</code> almost everywhere.", link: null },
            { title: "The $this keyword", body: "<code>$this</code> refers to the current object instance inside a method. <code>$this->title</code> accesses that object's title property.", link: null },
            { title: "static:: vs self::", body: "<code>self::</code> always refers to the class where the method is defined. <code>static::</code> uses late static binding — refers to the class that was actually called. Drupal uses <code>static::create()</code> in plugin factories so subclasses instantiate correctly.", link: "https://www.phptutorial.net/php-oop/php-objects/" },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "You define a class `Node` with a `protected string $title`. From outside the class, you try `$node->title = 'Hello'`. What happens?", options: ["It works fine", "PHP throws a fatal error — protected properties cannot be accessed outside the class", "It silently fails and does nothing", "It works but triggers a deprecation warning"], answer: 1, explanation: "Protected means only the class itself and subclasses can access it. Use a setter method or make it public." },
              { q: "What does `$this` refer to inside a class method?", options: ["The parent class", "The class definition itself", "The current object instance", "The static version of the class"], answer: 2, explanation: "`$this` always refers to the object that the method was called on." },
              { q: "When should you use `private` vs `protected` for a class property?", options: ["Use `private` when only THIS class should access it; `protected` when subclasses should also access it", "They are identical — use either interchangeably", "Use `private` for strings, `protected` for arrays", "Use `protected` for everything — it's safer"], answer: 0, explanation: "`private` locks to the exact class. `protected` allows inheritance. In Drupal you'll see `protected` most often because modules frequently extend base classes." },
              { q: "What is the difference between `self::` and `static::` when calling a static method?", options: ["They are identical", "`self::` always refers to the class where the method is defined; `static::` refers to the class that was actually called (late static binding)", "`static::` is deprecated — use `self::` always", "`self::` is for properties; `static::` is for methods"], answer: 1, explanation: "Drupal uses `static::create()` in plugin factory methods specifically because subclasses need late static binding to instantiate correctly." },
              { q: "You have a `User` class. Where should you define a method that calculates something from that user's data?", options: ["As a standalone function in a separate file", "As a method inside the `User` class", "In a global variable", "In a config file"], answer: 1, explanation: "Methods that operate on an object's data belong inside that object's class. This is encapsulation." },
              { q: "What output does this produce: `class Foo { public static int $count = 0; } Foo::$count++; echo Foo::$count;`", options: ["0", "1", "Fatal error", "null"], answer: 1, explanation: "Static properties belong to the class, not instances. `Foo::$count++` increments the class-level property to 1." },
            ],
            title: "Build a Node class",
            intro: "Build a Node class step-by-step — the same OOP pattern Drupal's entity system is based on.",
            steps: [
              {
                n: 1,
                title: "Create the working directory and file",
                body: "Create a dedicated practice directory and the Node.php file. This mirrors how Drupal organises module source files.",
                code: "mkdir -p practice\ntouch practice/Node.php",
              },
              {
                n: 2,
                title: "Open Node.php and add the PHP opening tag with strict types",
                body: "Every PHP file starts with `<?php`. The `declare(strict_types=1)` line forces PHP to enforce type declarations strictly — PHP won't silently coerce an integer to a string when a string is expected. All Drupal core files include this.",
                code: "<?php\ndeclare(strict_types=1);\n",
              },
              {
                n: 3,
                title: "Declare the class and add protected properties",
                body: "Properties are declared with a visibility modifier. We use `protected` (not `public`) because direct external access to raw data violates encapsulation. Subclasses that extend Node will still be able to read and write these properties.",
                code: "class Node {\n  protected string $title;\n  protected string $body;\n  protected bool $status;\n  protected int $createdAt;\n}",
              },
              {
                n: 4,
                title: "Write the constructor",
                body: "The constructor runs when you call `new Node(...)`. It sets the initial state. Notice `$status = true` and `$createdAt = 0` are optional parameters with defaults — callers don't need to supply them. The `?: time()` fallback sets the timestamp to now if 0 was passed.",
                code: "  public function __construct(\n    string $title,\n    string $body,\n    bool $status = true,\n    int $createdAt = 0\n  ) {\n    $this->title = $title;\n    $this->body  = $body;\n    $this->status    = $status;\n    $this->createdAt = $createdAt ?: time();\n  }",
              },
              {
                n: 5,
                title: "Add getter methods",
                body: "Because properties are `protected`, external code can't read them directly. Getters are `public` methods that expose values in a controlled way. Notice `isPublished()` instead of `getStatus()` — boolean getters in PHP conventionally start with `is`.",
                code: "  public function getTitle(): string   { return $this->title; }\n  public function getBody(): string    { return $this->body; }\n  public function isPublished(): bool  { return $this->status; }\n  public function getCreatedAt(): int  { return $this->createdAt; }",
              },
              {
                n: 6,
                title: "Add setTitle() with validation",
                body: "A setter that validates before assigning. If the title is empty we throw an `InvalidArgumentException` — this makes bugs visible immediately rather than allowing silent bad data. The method returns `void` because it doesn't produce a value.",
                code: "  public function setTitle(string $title): void {\n    if (trim($title) === '') {\n      throw new \\InvalidArgumentException('Title cannot be empty.');\n    }\n    $this->title = $title;\n  }",
              },
              {
                n: 7,
                title: "Add publish() and unpublish() helpers",
                body: "Rather than exposing a raw setter for `$status`, expressive named methods make the code read like English and prevent callers from passing arbitrary values.",
                code: "  public function publish(): void   { $this->status = true; }\n  public function unpublish(): void { $this->status = false; }",
              },
              {
                n: 8,
                title: "Add toArray()",
                body: "Returns all properties as an associative array. This pattern appears throughout Drupal — entities expose their data as arrays for serialization, API responses, and render arrays.",
                code: "  public function toArray(): array {\n    return [\n      'title'     => $this->title,\n      'body'      => $this->body,\n      'status'    => $this->status,\n      'createdAt' => $this->createdAt,\n    ];\n  }",
              },
              {
                n: 9,
                title: "Create test.php and verify everything works",
                body: "Run this file with `php practice/test.php`. You should see a var_dump with all four keys, then the 'Caught' line proving the exception fires. If you see a Fatal error on the setTitle line instead of 'Caught', you forgot the try/catch.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'Node.php';\n\n$node = new Node('Hello World', 'Body text here');\nvar_dump($node->toArray());\n// Expected: array(4) { [\"title\"]=> string(11) \"Hello World\" ... }\n\n$node->publish();\nvar_dump($node->isPublished()); // bool(true)\n\n$node->unpublish();\nvar_dump($node->isPublished()); // bool(false)\n\ntry {\n  $node->setTitle('');\n} catch (\\InvalidArgumentException $e) {\n  echo 'Caught: ' . $e->getMessage() . PHP_EOL;\n  // Expected: Caught: Title cannot be empty.\n}",
              },
            ],
            aiCheck: {
              prompt: "Paste your complete Node.php file and the output of running test.php.",
              checkGoal: "Verify: class has four protected properties (string title, string body, bool status, int createdAt), constructor sets all four with defaults, four getter methods with correct return types, setTitle() throws InvalidArgumentException on empty/whitespace-only string, publish()/unpublish() toggle status, toArray() returns all four as associative array. Test output must show the var_dump array and the 'Caught: Title cannot be empty.' line.",
            },
          },
        },

        // ── Day 2 ────────────────────────────────────────────────
        {
          day: "Day 2",
          title: "Inheritance & Method Overriding",
          goal: "Understand class inheritance — how Drupal's controller, form, and block base classes work.",
          reading: [
            { title: "The extends keyword", body: "A child class inherits all <code>public</code> and <code>protected</code> members of the parent. <code>class Article extends Node</code> gives Article everything Node has.", link: "https://www.php.net/manual/en/language.oop5.inheritance.php" },
            { title: "Overriding and parent::", body: "Redefine a parent method in the child class to change behaviour. Use <code>parent::methodName()</code> to also run the parent's version — Drupal's <code>ConfigFormBase::submitForm()</code> does exactly this.", link: null },
            { title: "Abstract classes", body: "Marked <code>abstract</code> — cannot be instantiated, must be extended. Drupal's <code>FormBase</code>, <code>BlockBase</code>, <code>ControllerBase</code> are all abstract. They provide shared behaviour subclasses inherit for free.", link: "https://www.php.net/manual/en/language.oop5.abstract.php" },
            { title: "final keyword", body: "<code>final</code> on a class or method prevents subclasses from overriding it. Drupal uses this on security-critical methods that must not be changed.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Form!FormBase.php" },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "Your module's form class extends `FormBase`. You call `$this->t('Hello')` inside your form. Where does the `t()` method come from?", options: ["You have to define it yourself", "It's a global PHP function", "It's inherited from FormBase (which extends FormStateInterface)", "It's inherited through FormBase's parent chain which implements StringTranslationTrait"], answer: 3, explanation: "`FormBase` uses `StringTranslationTrait` which provides `$this->t()`. You get it for free by extending `FormBase`." },
              { q: "You override `buildForm()` in your subclass but still want to run the parent's version too. What do you write?", options: ["$this->buildForm()", "parent::buildForm($form, $form_state)", "static::buildForm()", "super::buildForm()"], answer: 1, explanation: "`parent::methodName()` calls the parent class's version. Common in Drupal's `ConfigFormBase::submitForm()` where you call `parent::submitForm()` to get the default 'configuration saved' message." },
              { q: "What does `abstract` on a class mean in PHP?", options: ["The class is deprecated", "The class cannot be instantiated directly — it must be extended", "The class has no methods", "The class is read-only"], answer: 1, explanation: "Abstract classes are blueprints for other classes. Drupal's `FormBase` is abstract — you never do `new FormBase()`, you extend it." },
              { q: "A parent class method is marked `final`. What happens if a child class tries to override it?", options: ["The child's version silently wins", "PHP throws a fatal error — final methods cannot be overridden", "A deprecation warning is shown", "The parent's version always runs, ignoring the child"], answer: 1, explanation: "`final` is a hard lock. Drupal uses it on methods that must not be changed by subclasses for security or correctness reasons." },
              { q: "You have `class ArticleController extends ControllerBase`. The `ControllerBase` has a method `redirect()`. In your controller, can you call `$this->redirect('node.add')`?", options: ["No — you can only call methods you define yourself", "Yes — inherited methods are available on $this", "Only if you redeclare the method in your class", "Only with parent::redirect()"], answer: 1, explanation: "Inheritance means all public and protected parent methods are available via `$this` in child classes." },
            ],
            title: "Extend Node into an Article class",
            intro: "Build an Article class that extends Node, adds its own properties, and overrides toArray() — the same pattern Drupal uses for content type bundles.",
            steps: [
              {
                n: 1,
                title: "Create Article.php and require Node",
                body: "Create the file and pull in the parent class. We use `require_once` rather than `require` so PHP won't fail if the file is accidentally included twice.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'Node.php';\n",
              },
              {
                n: 2,
                title: "Declare Article extending Node",
                body: "The `extends` keyword gives Article all of Node's protected properties and public methods for free. You don't need to redeclare `$title`, `$body`, etc.",
                code: "class Article extends Node {\n  protected string $author;\n  protected array  $tags;\n}",
              },
              {
                n: 3,
                title: "Write the constructor calling parent::__construct()",
                body: "Article's constructor receives all Node parameters PLUS its own. It passes the Node parameters up to the parent constructor using `parent::__construct()`. If you forget this call, the parent properties are never initialised and PHP will fatal when you call getTitle().",
                code: "  public function __construct(\n    string $title,\n    string $body,\n    string $author,\n    array  $tags      = [],\n    bool   $status    = true,\n    int    $createdAt = 0\n  ) {\n    parent::__construct($title, $body, $status, $createdAt);\n    $this->author = $author;\n    $this->tags   = $tags;\n  }",
              },
              {
                n: 4,
                title: "Override toArray() and merge with parent data",
                body: "We redefine toArray() to include Article-specific fields. `parent::toArray()` returns the four Node fields; `array_merge()` appends the Article fields. The right array wins duplicate keys — which is what we want here.",
                code: "  public function toArray(): array {\n    return array_merge(parent::toArray(), [\n      'author' => $this->author,\n      'tags'   => $this->tags,\n    ]);\n  }",
              },
              {
                n: 5,
                title: "Add getAuthor() and getTags() getters",
                body: "Follow the same getter pattern as Node. External code should never read `$author` directly.",
                code: "  public function getAuthor(): string { return $this->author; }\n  public function getTags(): array    { return $this->tags; }",
              },
              {
                n: 6,
                title: "Add addTag() — appending to the array",
                body: "The `[]= ` operator appends to a PHP array. This is the idiomatic way to push a single item. Notice we don't deduplicate here — that's a deliberate choice to keep the method simple.",
                code: "  public function addTag(string $tag): void {\n    $this->tags[] = $tag;\n  }",
              },
              {
                n: 7,
                title: "Add getSummary() with a word-boundary truncation",
                body: "`substr()` cuts the string at $maxLength characters. But cutting mid-word looks bad — `strrpos()` finds the last space within the cut, so we break at the nearest word boundary instead.",
                code: "  public function getSummary(int $maxLength = 100): string {\n    if (strlen($this->body) <= $maxLength) {\n      return $this->body;\n    }\n    $cut  = substr($this->body, 0, $maxLength);\n    $last = strrpos($cut, ' ');\n    return ($last !== false ? substr($cut, 0, $last) : $cut) . '...';\n  }",
              },
              {
                n: 8,
                title: "Test: verify toArray() returns all 6 keys and addTag() works",
                body: "Run `php practice/test_article.php`. The var_dump must show 6 keys: title, body, status, createdAt, author, tags. The tags array should contain 3 items after three addTag() calls.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'Article.php';\n\n$article = new Article('Drupal Hooks', 'Hooks let modules react to Drupal lifecycle events.', 'Roland');\n$article->addTag('drupal');\n$article->addTag('php');\n$article->addTag('hooks');\n\nvar_dump($article->toArray());\n// Expected: array(6) with keys title, body, status, createdAt, author, tags\n\necho $article->getSummary(20) . PHP_EOL;\n// Expected: \"Hooks let modules...\" (truncated at word boundary)",
              },
            ],
            aiCheck: {
              prompt: "Paste Article.php and the output of test_article.php.",
              checkGoal: "Verify: Article extends Node, constructor calls parent::__construct() with correct parameter order, toArray() uses array_merge(parent::toArray(), [...]) producing 6 keys, addTag() appends to $tags, getSummary() truncates at word boundary with ellipsis. Output must show array(6) with all six expected keys and the truncated summary.",
            },
          },
        },

        // ── Day 3 ────────────────────────────────────────────────
        {
          day: "Day 3",
          title: "Interfaces & Type Hinting",
          goal: "Understand interfaces — Drupal's entire service and plugin system is built on them.",
          reading: [
            { title: "What an interface is", body: "A contract — defines what methods a class MUST implement, not how they work. <code>interface ContentInterface { public function getTitle(): string; }</code>", link: "https://www.php.net/manual/en/language.oop5.interfaces.php" },
            { title: "implements keyword", body: "A class promises to provide all interface methods. If any are missing, PHP throws a fatal error. A class can implement multiple interfaces simultaneously.", link: null },
            { title: "Type hinting with interfaces", body: "<code>function render(ContentInterface $content)</code> accepts ANY class implementing that interface. This is why Drupal type-hints against <code>EntityTypeManagerInterface</code> — works with any implementation, easily mocked in tests.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Entity!EntityInterface.php" },
            { title: "Interface segregation", body: "Small, focused interfaces are better than one large one. Drupal has hundreds of specific interfaces — <code>CacheBackendInterface</code>, <code>EntityStorageInterface</code>, etc. — allowing implementations to be swapped transparently.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "You have `interface LoggerInterface { public function log(string $message): void; }`. Your class `implements LoggerInterface` but doesn't define `log()`. What happens?", options: ["PHP silently ignores the missing method", "PHP throws a fatal error — all interface methods must be implemented", "The interface's default implementation is used", "A warning is shown but code runs"], answer: 1, explanation: "Interfaces are contracts. If you promise to implement a method, you must deliver it or PHP refuses to run." },
              { q: "Why does Drupal type-hint against `EntityTypeManagerInterface` rather than `EntityTypeManager` (the concrete class)?", options: ["It's shorter to type", "So the code works with any class that implements the interface — easier to test with mocks and swap implementations", "`EntityTypeManager` doesn't exist", "It's a coding style preference with no practical difference"], answer: 1, explanation: "Interface type hints allow mocking in tests and future-proofing — swap the real class without changing consuming code." },
              { q: "Can a PHP class implement two interfaces at once?", options: ["No — PHP only allows one interface per class", "Yes — `class Foo implements InterfaceA, InterfaceB`", "Only if the interfaces extend the same parent", "Only abstract classes can implement multiple interfaces"], answer: 1, explanation: "Multiple interface implementation is common. Drupal block plugins often implement `BlockPluginInterface` and `ContainerFactoryPluginInterface` simultaneously." },
              { q: "An interface defines `public function save(): bool`. A class implementing it defines `public function save(): void`. What happens?", options: ["Works fine — return types don't matter for interfaces", "Fatal error — the return type must match the interface declaration", "The interface return type is ignored", "A deprecation notice"], answer: 1, explanation: "In PHP 8+, return type declarations must be compatible with the interface. Mismatches cause fatal errors." },
              { q: "You're writing a function that should accept any entity (node, user, taxonomy term). What's the correct type hint?", options: ["function process(Node $entity)", "function process(object $entity)", "function process(EntityInterface $entity)", "function process($entity)"], answer: 2, explanation: "`EntityInterface` is implemented by all Drupal entity types. Type-hinting against it means your function works with any entity while still getting IDE autocomplete and type safety." },
            ],
            title: "Define ContentInterface and implement it in two classes",
            intro: "Define an interface, make Node implement it, then create a completely separate Page class that also satisfies it — and write a function that works with both.",
            steps: [
              {
                n: 1,
                title: "Create ContentInterface.php",
                body: "An interface file contains only method signatures — no property declarations and no method bodies. Every method listed here becomes a contract that any implementing class must honour.",
                code: "<?php\ndeclare(strict_types=1);\n\ninterface ContentInterface {\n  public function getTitle(): string;\n  public function getBody(): string;\n  public function isPublished(): bool;\n  public function toArray(): array;\n}",
              },
              {
                n: 2,
                title: "Update Node.php to implement ContentInterface",
                body: "Change only the class declaration line. PHP will immediately verify that Node provides all four interface methods. Because we added them on Day 1, this should pass without any other changes.",
                code: "// In Node.php — change the class declaration:\nrequire_once 'ContentInterface.php';\n\nclass Node implements ContentInterface {\n  // ... all existing code stays exactly the same\n}",
              },
              {
                n: 3,
                title: "Verify PHP enforces the contract",
                body: "Temporarily remove one of the getter methods from Node, then run your test file. PHP will throw a fatal error like `Class Node contains 1 abstract method and must therefore be declared abstract or implement the remaining methods`. Add the method back when done.",
                code: "// Temporarily comment out getTitle() in Node.php\n// php practice/test.php\n// Expected: Fatal error: Class Node contains 1 abstract method...\n// Uncomment getTitle() and run again — should pass",
              },
              {
                n: 4,
                title: "Create a separate Page class that also implements ContentInterface",
                body: "Page has no relation to Node — it's a completely independent class. Yet because it implements ContentInterface, any code that accepts ContentInterface will work with Page too. This is the power of programming to an interface.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'ContentInterface.php';\n\nclass Page implements ContentInterface {\n  public function __construct(\n    private string $title,\n    private string $body,\n    private bool   $status = true\n  ) {}\n\n  public function getTitle(): string  { return $this->title; }\n  public function getBody(): string   { return $this->body; }\n  public function isPublished(): bool { return $this->status; }\n\n  public function toArray(): array {\n    return [\n      'title'  => $this->title,\n      'body'   => $this->body,\n      'status' => $this->status,\n    ];\n  }\n}",
              },
              {
                n: 5,
                title: "Write a renderContent() function type-hinted against the interface",
                body: "This function only knows it receives something that implements ContentInterface. It doesn't care whether it's a Node, Page, or any future class. This is polymorphism — the same code handles different types transparently.",
                code: "function renderContent(ContentInterface $content): string {\n  $status = $content->isPublished() ? 'Published' : 'Draft';\n  return sprintf(\n    \"<article>\\n  <h1>%s</h1>\\n  <p>%s</p>\\n  <span>%s</span>\\n</article>\",\n    htmlspecialchars($content->getTitle()),\n    htmlspecialchars($content->getBody()),\n    $status\n  );\n}",
              },
              {
                n: 6,
                title: "Test that renderContent() accepts both Node and Page",
                body: "Run `php practice/test_interface.php`. Both calls to renderContent() must work without errors. If you try passing a plain object that doesn't implement ContentInterface, PHP will throw a TypeError — that's the type safety working correctly.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'Node.php';\nrequire_once 'Page.php';\n\nfunction renderContent(ContentInterface $content): string {\n  $status = $content->isPublished() ? 'Published' : 'Draft';\n  return \"<h1>{$content->getTitle()}</h1><span>{$status}</span>\";\n}\n\n$node = new Node('Drupal Nodes', 'Everything in Drupal is a node.');\n$page = new Page('About Us', 'We are a Drupal agency.');\n\necho renderContent($node) . PHP_EOL; // Works — Node implements ContentInterface\necho renderContent($page) . PHP_EOL; // Works — Page implements ContentInterface",
              },
            ],
            aiCheck: {
              prompt: "Paste ContentInterface.php, the updated Node.php class declaration line, Page.php, and the output of test_interface.php.",
              checkGoal: "Verify: ContentInterface declares exactly four methods with correct return types, Node class declaration includes `implements ContentInterface`, Page is a completely separate class also implementing ContentInterface with constructor property promotion, renderContent() type-hints against ContentInterface not Node or Page, output shows both HTML strings rendered correctly.",
            },
          },
        },

        // ── Day 4 ────────────────────────────────────────────────
        {
          day: "Day 4",
          title: "Traits",
          goal: "Understand PHP traits — Drupal uses them extensively for shared behavior across unrelated classes.",
          reading: [
            { title: "What a trait is", body: "A reusable set of methods that can be mixed into any class — like a partial class. Solves 'I need this behavior in multiple classes that don't share a parent'. Added with <code>use TraitName;</code> inside the class body.", link: "https://www.php.net/manual/en/language.oop5.traits.php" },
            { title: "Drupal trait examples", body: "<strong>StringTranslationTrait</strong> — adds <code>$this->t()</code> to any class. <strong>MessengerTrait</strong> — adds <code>$this->messenger()</code>. <strong>LoggerChannelTrait</strong> — adds logging. You get these for free by adding one <code>use</code> statement.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Core!StringTranslation!StringTranslationTrait.php" },
            { title: "Traits vs interfaces", body: "Interfaces define WHAT (the contract). Traits define HOW (the implementation). A class can use multiple traits AND implement multiple interfaces simultaneously.", link: null },
            { title: "Conflict resolution", body: "If two traits define the same method name, use <code>insteadof</code> to pick one: <code>TraitA::log insteadof TraitB</code>. Alias the other with <code>TraitB::log as logFromB</code>.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "You want your service class to have access to `$this->t()` for translations without extending `FormBase`. What's the cleanest solution?", options: ["Copy the `t()` method code into your class", "Extend FormBase", "Use StringTranslationTrait — add `use StringTranslationTrait;` in your class body", "Call `\\Drupal::translation()->translate()` every time"], answer: 2, explanation: "Traits are the correct solution here. `StringTranslationTrait` adds `$this->t()` to any class without inheritance." },
              { q: "Two traits your class uses both define a method called `log()`. What must you do?", options: ["PHP picks one automatically — whichever is listed first", "Use the `insteadof` keyword to specify which trait's method to use", "You cannot use both traits", "Rename one of the traits"], answer: 1, explanation: "`TraitA::log insteadof TraitB` resolves the conflict explicitly. You can also alias with `as`." },
              { q: "What is the key difference between a trait and an abstract class?", options: ["Traits can have properties; abstract classes cannot", "A class can use multiple traits but can only extend one abstract class", "Abstract classes are faster at runtime", "Traits are deprecated in PHP 8"], answer: 1, explanation: "This is the main reason traits exist. PHP has single inheritance, so traits fill the gap when you need shared behavior across unrelated class hierarchies." },
              { q: "Can a trait have properties as well as methods?", options: ["No — traits can only contain methods", "Yes — traits can have both properties and methods", "Only static properties", "Only if the trait extends a class"], answer: 1, explanation: "Traits can have properties, methods, and abstract methods. Drupal's `MessengerTrait` uses a property to cache the messenger service." },
            ],
            title: "Build a LoggingTrait and apply it to two unrelated classes",
            intro: "Create a reusable logging trait, apply it to both Node and a new UserService class, and verify each instance keeps its own independent log.",
            steps: [
              {
                n: 1,
                title: "Create LoggingTrait.php with the trait declaration",
                body: "A trait file looks almost identical to a class file — the only difference is the `trait` keyword. The trait owns the `$logs` property; every class that uses the trait gets their own copy of that property.",
                code: "<?php\ndeclare(strict_types=1);\n\ntrait LoggingTrait {\n  protected array $logs = [];\n}",
              },
              {
                n: 2,
                title: "Add the log() method to the trait",
                body: "Each call appends an associative array with level, message, and Unix timestamp. Using an associative array (not just a string) lets callers filter by level later.",
                code: "  public function log(string $level, string $message): void {\n    $this->logs[] = [\n      'level'   => $level,\n      'message' => $message,\n      'time'    => time(),\n    ];\n  }",
              },
              {
                n: 3,
                title: "Add getLogs() and clearLogs()",
                body: "`getLogs()` returns the full array. An optional `$level` filter returns only entries of that level — useful when you only want warnings or only info messages.",
                code: "  public function getLogs(?string $level = null): array {\n    if ($level === null) {\n      return $this->logs;\n    }\n    return array_filter($this->logs, fn($entry) => $entry['level'] === $level);\n  }\n\n  public function clearLogs(): void {\n    $this->logs = [];\n  }",
              },
              {
                n: 4,
                title: "Add the trait to Node",
                body: "A single `use` statement inside the class body is all it takes. Node immediately gains log(), getLogs(), and clearLogs() as if they were written directly in the Node class.",
                code: "// In Node.php, inside the class body — add as the first line:\nclass Node implements ContentInterface {\n  use LoggingTrait;\n\n  // ... existing properties and methods unchanged\n}",
              },
              {
                n: 5,
                title: "Create UserService.php using the same trait",
                body: "UserService has no relation to Node — it doesn't extend it, share a parent, or implement the same interfaces. Yet it gets identical logging capability just by declaring `use LoggingTrait`. This is trait reuse at work.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'LoggingTrait.php';\n\nclass UserService {\n  use LoggingTrait;\n\n  public function authenticate(string $email, string $password): bool {\n    $success = ($email === 'admin@example.com' && $password === 'secret');\n    $this->log(\n      $success ? 'info' : 'warning',\n      sprintf('Auth attempt for %s: %s', $email, $success ? 'success' : 'failed')\n    );\n    return $success;\n  }\n}",
              },
              {
                n: 6,
                title: "Test: verify each instance has its own isolated log",
                body: "Run `php practice/test_trait.php`. The critical thing to confirm: $node->getLogs() and $userService->getLogs() return DIFFERENT arrays. Each object instance owns its own $logs array — they don't share one. Also test the level filter.",
                code: "<?php\ndeclare(strict_types=1);\nrequire_once 'Node.php';\nrequire_once 'UserService.php';\n\n$node = new Node('Test', 'Body');\n$node->log('info', 'Node created');\n$node->log('warning', 'Title is short');\n\n$users = new UserService();\n$users->authenticate('admin@example.com', 'secret'); // info\n$users->authenticate('hacker@evil.com', 'guess');    // warning\n\nvar_dump(count($node->getLogs()));   // int(2)\nvar_dump(count($users->getLogs()));  // int(2)\n\n// Filter test:\nvar_dump(count($users->getLogs('warning'))); // int(1)\nvar_dump(count($users->getLogs('info')));    // int(1)\n\n$node->clearLogs();\nvar_dump(count($node->getLogs())); // int(0) — node cleared, users unaffected\nvar_dump(count($users->getLogs())); // int(2) — still 2",
              },
            ],
            aiCheck: {
              prompt: "Paste LoggingTrait.php, the `use LoggingTrait;` line in Node.php, UserService.php, and the complete output of test_trait.php.",
              checkGoal: "Verify: trait has $logs property, log() method with level/message/time structure, getLogs() with optional level filter using array_filter, clearLogs(). Node and UserService each use the trait. Output must show each instance has count=2, level filter returns count=1, clearing Node logs doesn't affect UserService.",
            },
          },
        },

        // ── Day 5 ────────────────────────────────────────────────
        {
          day: "Day 5",
          title: "Namespaces & Autoloading",
          goal: "Understand PHP namespaces — every Drupal class uses them and you need to be fluent.",
          reading: [
            { title: "What namespaces are", body: "A way to organize classes and avoid naming conflicts — like folders for code. <code>namespace Drupal\\my_module\\Controller;</code> at the top of a file.", link: "https://www.php.net/manual/en/language.namespaces.php" },
            { title: "PSR-4 autoloading", body: "The namespace maps to a folder path. <code>Drupal\\my_module\\Controller\\MyController</code> maps to <code>my_module/src/Controller/MyController.php</code>. Drupal's PSR-4 root: <code>Drupal\\module_name</code> maps to <code>module_name/src/</code>.", link: "https://www.php-fig.org/psr/psr-4/" },
            { title: "use statements", body: "Import class names into scope: <code>use Drupal\\Core\\Entity\\EntityTypeManagerInterface;</code> — now you can write <code>EntityTypeManagerInterface</code> instead of the full path. PHP's autoloader handles loading the file.", link: "https://www.drupal.org/docs/develop/standards/psr-4-namespaces-and-autoloading-in-drupal-8" },
            { title: "Global namespace", body: "The leading backslash in <code>new \\Exception('error')</code> means global namespace — the built-in PHP Exception, not one from your current namespace. Drupal uses <code>\\Exception</code>, <code>\\DateTime</code>, etc. throughout.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "Your module is called `news_manager`. You create `src/Controller/ArticleController.php`. What should the namespace declaration be?", options: ["namespace Controller\\ArticleController;", "namespace Drupal\\news_manager\\Controller;", "namespace news_manager\\src\\Controller;", "namespace Drupal\\Controller\\news_manager;"], answer: 1, explanation: "PSR-4 in Drupal: `Drupal\\{module_name}\\{path_from_src}`. The `src/` folder is the PSR-4 root." },
              { q: "You write `use Drupal\\Core\\Entity\\EntityTypeManagerInterface;` at the top of a file. What does this do?", options: ["Loads the file immediately", "Creates an alias so you can write `EntityTypeManagerInterface` instead of the full namespace path", "Checks if the class exists", "Registers the class with Drupal's service container"], answer: 1, explanation: "`use` imports the class name into the current file's scope for convenience. PHP's autoloader handles actually loading the file when the class is first used." },
              { q: "Two classes in different namespaces are both called `Exception`. You need to use both in the same file. How do you resolve this?", options: ["You can't — class name conflicts are fatal", "Use the full namespace path for one: `\\Drupal\\MyModule\\Exception` vs `\\Exception`", "Use `use Drupal\\MyModule\\Exception as MyException;` to alias one", "Either B or C work"], answer: 3, explanation: "Both approaches work. Aliasing with `as` is cleaner when both are used frequently." },
              { q: "Where does Composer know to look for `Drupal\\my_module\\Service\\MyService`?", options: ["Wherever you specify in settings.php", "It scans all PHP files on every request", "In `my_module/src/Service/MyService.php` based on the PSR-4 mapping in composer.json", "In `my_module/lib/Service/MyService.php`"], answer: 2, explanation: "PSR-4 maps `Drupal\\my_module` to `my_module/src/`. Composer generates an optimized autoloader map so lookups are instant." },
              { q: "What does the leading backslash mean in `new \\Exception('error')`?", options: ["It's a typo", "It references the global namespace — the built-in PHP `Exception` class, not one from your current namespace", "It imports the class", "It creates a static instance"], answer: 1, explanation: "Without `\\`, PHP looks for `Exception` in your current namespace first. With `\\`, it explicitly goes to the global namespace. Drupal code uses `\\Exception`, `\\DateTime`, etc. for this reason." },
            ],
            title: "Reorganise practice code with namespaces and PSR-4",
            intro: "Restructure the practice directory into a proper namespace layout with Composer autoloading — exactly how a real Drupal module is organised.",
            steps: [
              {
                n: 1,
                title: "Create the PSR-4 directory structure",
                body: "The `src/` folder is the PSR-4 root. Subdirectories map to namespace segments. This mirrors `my_module/src/` in Drupal where `Drupal\\my_module` is the root namespace.",
                code: "mkdir -p practice/src/Entity\nmkdir -p practice/src/Service\nmkdir -p practice/src/Contract\nls -R practice/src\n# Expected:\n# practice/src/Contract/\n# practice/src/Entity/\n# practice/src/Service/",
              },
              {
                n: 2,
                title: "Move ContentInterface into src/Contract/ with a namespace",
                body: "The namespace must match the directory path from the PSR-4 root. `Practice` is our root namespace (maps to `src/`), and `Contract` is the subdirectory, so the full namespace is `Practice\\Contract`.",
                code: "<?php\n// practice/src/Contract/ContentInterface.php\ndeclare(strict_types=1);\n\nnamespace Practice\\Contract;\n\ninterface ContentInterface {\n  public function getTitle(): string;\n  public function getBody(): string;\n  public function isPublished(): bool;\n  public function toArray(): array;\n}",
              },
              {
                n: 3,
                title: "Move Node into src/Entity/ with namespace and use statement",
                body: "The `use` statement imports ContentInterface so we can write just `ContentInterface` in the `implements` clause instead of the full `\\Practice\\Contract\\ContentInterface`. This is exactly how all Drupal source files work.",
                code: "<?php\n// practice/src/Entity/Node.php\ndeclare(strict_types=1);\n\nnamespace Practice\\Entity;\n\nuse Practice\\Contract\\ContentInterface;\n\nclass Node implements ContentInterface {\n  // ... all existing properties and methods unchanged\n  // Note: \\InvalidArgumentException stays with backslash — it's a global class\n}",
              },
              {
                n: 4,
                title: "Create ContentService in src/Service/ with a use statement",
                body: "ContentService lives in the `Practice\\Service` namespace and uses Node from `Practice\\Entity`. Notice how the `use` statement makes the code readable — no full namespace paths cluttering the method signatures.",
                code: "<?php\n// practice/src/Service/ContentService.php\ndeclare(strict_types=1);\n\nnamespace Practice\\Service;\n\nuse Practice\\Entity\\Node;\nuse Practice\\Contract\\ContentInterface;\n\nclass ContentService {\n\n  public function publish(ContentInterface $content): void {\n    // Any ContentInterface implementation works here\n  }\n\n  public function createNode(string $title, string $body): Node {\n    return new Node($title, $body);\n  }\n}",
              },
              {
                n: 5,
                title: "Create composer.json with PSR-4 autoload mapping",
                body: "This tells Composer: 'when you see a class starting with `Practice\\`, look in the `src/` folder'. The double backslash is required because backslash is a JSON escape character.",
                code: "// practice/composer.json\n{\n  \"autoload\": {\n    \"psr-4\": {\n      \"Practice\\\\\\\\\": \"src/\"\n    }\n  }\n}",
              },
              {
                n: 6,
                title: "Run composer dump-autoload to generate the autoloader",
                body: "Composer reads your `composer.json` and generates a `vendor/autoload.php` file. This file contains a class map so PHP can find any `Practice\\*` class without manual `require` calls.",
                code: "cd practice && composer dump-autoload\n# Expected output:\n# Generating autoload files\n# Generated autoload files\nls vendor/\n# Expected: autoload.php  composer/",
              },
              {
                n: 7,
                title: "Create index.php using use statements — no require_once",
                body: "Notice there are NO `require_once` calls for individual class files. The single `require 'vendor/autoload.php'` line handles everything. This is how Drupal works — the autoloader is bootstrapped once and all classes load on demand.",
                code: "<?php\n// practice/index.php\ndeclare(strict_types=1);\n\nrequire 'vendor/autoload.php';\n\nuse Practice\\Entity\\Node;\nuse Practice\\Service\\ContentService;\n\n$node    = new Node('Test', 'Body');\n$service = new ContentService();\n$created = $service->createNode('New Node', 'Content here');\n\nvar_dump($created->getTitle()); // string(8) \"New Node\"\necho 'Classes loaded without any require_once!' . PHP_EOL;",
              },
              {
                n: 8,
                title: "Run index.php and confirm autoloading works",
                body: "Run `php practice/index.php`. If you see the var_dump output and the success message, autoloading is working. If you get a 'Class not found' error, check: (1) namespace matches directory exactly, (2) composer.json PSR-4 key ends with `\\\\`, (3) you ran `composer dump-autoload` after any file moves.",
                code: "php practice/index.php\n# Expected:\n# string(8) \"New Node\"\n# Classes loaded without any require_once!",
              },
            ],
            aiCheck: {
              prompt: "Paste `find practice/src -name '*.php'` output, your composer.json, and index.php. Confirm no require_once calls for individual class files.",
              checkGoal: "Verify: three src/ subdirectories (Contract, Entity, Service), each file has correct namespace matching its directory path, use statements import classes across namespaces, composer.json has psr-4 mapping with Practice\\\\ key, index.php requires only vendor/autoload.php, output shows string(8) 'New Node' and success message.",
            },
          },
        },

        // ── Day 6 ────────────────────────────────────────────────
        {
          day: "Day 6",
          title: "Type Declarations & Error Handling",
          goal: "Write robust PHP with proper type safety and exception handling — Drupal uses both extensively.",
          reading: [
            { title: "Type declarations", body: "Scalar types: <code>string</code>, <code>int</code>, <code>float</code>, <code>bool</code>. Nullable: <code>?string</code> = string or null. Union types (PHP 8): <code>int|string</code>. <code>readonly</code> properties (PHP 8.1) — used throughout Drupal 10/11.", link: "https://www.php.net/manual/en/language.types.declarations.php" },
            { title: "strict_types", body: "<code>declare(strict_types=1)</code> at the top of a file makes PHP enforce types strictly instead of coercing them. All Drupal files use strict types. Without it, PHP silently converts <code>5</code> to <code>'5'</code> when a string is expected.", link: null },
            { title: "Try/catch/finally", body: "Catch specific exception types: <code>catch (\\InvalidArgumentException $e)</code>. Exception hierarchy: <code>\\InvalidArgumentException</code> extends <code>\\RuntimeException</code> extends <code>\\Exception</code>. Catching a parent catches all children.", link: "https://www.php.net/manual/en/language.exceptions.php" },
            { title: "Custom exceptions in Drupal", body: "Drupal throws <code>\\InvalidArgumentException</code> for bad input, <code>\\RuntimeException</code> for unexpected runtime failures, custom entity exceptions like <code>EntityStorageException</code>. Creating custom exception classes extends <code>\\Exception</code>.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "A function signature is `function loadNode(int $id): ?Node`. You call it with `loadNode(0)`. The node doesn't exist. What should the function return?", options: ["false", "An empty Node object", "null — the `?` means the return can be null", "It must throw an exception"], answer: 2, explanation: "The `?Node` return type means the function can return either a `Node` object or `null`. Returning `null` when not found is a common Drupal pattern." },
              { q: "You catch `\\Exception` in a try/catch block. A `\\InvalidArgumentException` is thrown. Does your catch block catch it?", options: ["No — you must catch the exact exception type", "Yes — `\\InvalidArgumentException` extends `\\RuntimeException` which extends `\\Exception`", "Only if you add `| \\InvalidArgumentException` to the catch", "Only in PHP 8+"], answer: 1, explanation: "Exception classes form a hierarchy. Catching a parent exception type catches all its children. Catching `\\Exception` catches everything (except `\\Error`)." },
              { q: "What does `readonly` on a class property mean in PHP 8.1+?", options: ["The property cannot be read from outside the class", "The property can only be set once (during construction) and never modified after", "The property is automatically serialized", "It's the same as private"], answer: 1, explanation: "`readonly` enforces immutability after initialization. Drupal 10/11 use this in value objects and DTOs to prevent accidental mutation." },
              { q: "Your function is declared `function process(string $input): string` but you pass an integer `5`. What happens in PHP 8 with strict types enabled?", options: ["PHP coerces 5 to '5' automatically", "PHP throws a TypeError", "The function receives null", "A warning is shown but code runs"], answer: 1, explanation: "With `declare(strict_types=1)`, PHP enforces types strictly. Without it, PHP coerces compatible types. Drupal files typically use strict types." },
              { q: "You have a `finally` block in a try/catch. When does it run?", options: ["Only when no exception is thrown", "Only when an exception IS thrown", "Always — whether an exception was thrown or not", "Only in PHP 8+"], answer: 2, explanation: "`finally` always runs. Use it for cleanup (close file handles, release locks) that must happen regardless of success or failure." },
            ],
            title: "Harden your classes with strict types and custom exceptions",
            intro: "Add type declarations throughout, create a custom exception class, and write multi-catch error handling that mirrors Drupal's patterns.",
            steps: [
              {
                n: 1,
                title: "Prove what strict_types prevents",
                body: "Create a quick test to see the difference. With strict_types ON, passing an int where a string is expected throws a TypeError. Without it, PHP silently coerces. This is why all Drupal files start with declare(strict_types=1).",
                code: "<?php\ndeclare(strict_types=1);\n\nfunction greet(string $name): string {\n  return \"Hello, {$name}\";\n}\n\necho greet('Roland') . PHP_EOL;  // Works fine\necho greet(42) . PHP_EOL;        // TypeError: must be string, int given\n// Comment out declare(strict_types=1) and run again — 42 becomes '42' silently",
              },
              {
                n: 2,
                title: "Add full return types to all Node methods",
                body: "Open Node.php and ensure every method has a return type. Check that getCreatedAt() returns `int`, isPublished() returns `bool`, and toArray() returns `array`. The constructor returns `void` implicitly — you can add `: void` explicitly.",
                code: "// In Node.php — ensure all signatures look like:\npublic function getTitle(): string   { return $this->title; }\npublic function getBody(): string    { return $this->body; }\npublic function isPublished(): bool  { return $this->status; }\npublic function getCreatedAt(): int  { return $this->createdAt; }\npublic function publish(): void      { $this->status = true; }\npublic function unpublish(): void    { $this->status = false; }\npublic function toArray(): array     { /* ... */ }",
              },
              {
                n: 3,
                title: "Create a ContentNotFoundException custom exception",
                body: "Custom exceptions extend RuntimeException (or Exception). The static factory method `forId()` creates a pre-formatted exception — callers write `throw ContentNotFoundException::forId(42)` instead of constructing the message themselves. Drupal uses this pattern extensively.",
                code: "<?php\n// practice/src/Exception/ContentNotFoundException.php\ndeclare(strict_types=1);\n\nnamespace Practice\\Exception;\n\nclass ContentNotFoundException extends \\RuntimeException {\n\n  public static function forId(int $id): self {\n    return new self(\"Content with ID {$id} was not found.\");\n  }\n\n  public static function forTitle(string $title): self {\n    return new self(\"Content titled '{$title}' was not found.\");\n  }\n}",
              },
              {
                n: 4,
                title: "Add a find() method to ContentService that throws exceptions",
                body: "`find()` validates the input first (throw InvalidArgumentException for bad data), then simulates a lookup. Returning null would silently hide errors — throwing a typed exception makes problems impossible to ignore.",
                code: "// In ContentService.php — add this method:\nuse Practice\\Exception\\ContentNotFoundException;\n\npublic function find(int $id): Node {\n  if ($id <= 0) {\n    throw new \\InvalidArgumentException(\n      \"ID must be a positive integer, got {$id}.\"\n    );\n  }\n  // Simulate: IDs 1-3 exist\n  if ($id > 3) {\n    throw ContentNotFoundException::forId($id);\n  }\n  return new Node(\"Node #{$id}\", \"Body for node {$id}\");\n}",
              },
              {
                n: 5,
                title: "Write separate catch blocks for each exception type",
                body: "Catch the most specific exception first (ContentNotFoundException), then the broader one (InvalidArgumentException). If you reversed the order and caught InvalidArgumentException first, it would never match because ContentNotFoundException extends RuntimeException, not InvalidArgumentException.",
                code: "<?php\ndeclare(strict_types=1);\nrequire 'vendor/autoload.php';\n\nuse Practice\\Service\\ContentService;\nuse Practice\\Exception\\ContentNotFoundException;\n\n$service = new ContentService();\n\n// Test 1: bad input\ntry {\n  $service->find(-1);\n} catch (\\InvalidArgumentException $e) {\n  echo 'Validation: ' . $e->getMessage() . PHP_EOL;\n}\n// Expected: Validation: ID must be a positive integer, got -1.",
              },
              {
                n: 6,
                title: "Test the not-found exception and the finally block",
                body: "`finally` always runs — whether an exception was thrown or not. Use it to confirm cleanup happens in both success and failure paths. Run the file and verify all three output lines appear in the correct order.",
                code: "// Test 2: not found\ntry {\n  $node = $service->find(99);\n  echo 'Found: ' . $node->getTitle() . PHP_EOL;\n} catch (ContentNotFoundException $e) {\n  echo 'Not found: ' . $e->getMessage() . PHP_EOL;\n} finally {\n  echo 'Finally block ran.' . PHP_EOL;\n}\n// Expected:\n// Not found: Content with ID 99 was not found.\n// Finally block ran.\n\n// Test 3: success path — finally still runs\ntry {\n  $node = $service->find(1);\n  echo 'Found: ' . $node->getTitle() . PHP_EOL;\n} catch (ContentNotFoundException $e) {\n  echo 'Not found: ' . $e->getMessage() . PHP_EOL;\n} finally {\n  echo 'Finally block ran.' . PHP_EOL;\n}\n// Expected:\n// Found: Node #1\n// Finally block ran.",
              },
            ],
            aiCheck: {
              prompt: "Paste ContentNotFoundException.php, the find() method from ContentService.php, and the full output of your exception test file.",
              checkGoal: "Verify: ContentNotFoundException extends RuntimeException with two static factory methods, find() throws InvalidArgumentException for id<=0 and ContentNotFoundException for id>3, catch blocks are in correct order (specific before general), finally block output appears after both the success and failure paths, strict_types=1 is present in all files.",
            },
          },
        },

        // ── Day 7 ────────────────────────────────────────────────
        {
          day: "Day 7",
          title: "Week 1 Review",
          goal: "Consolidate OOP fundamentals with a comprehensive written challenge.",
          reading: [],
          activity: {
            type: "ai_open",
            prompt: "Answer all three without looking at notes:\n\n1. You're building a Drupal custom module. Explain the complete class structure for a block plugin — what class does it extend, what interface does it implement, what methods are required, and how would you inject a service into it.\n\n2. PHP has both abstract classes and interfaces. Drupal uses both. Explain the difference with a real Drupal example of each — when would you use an abstract class vs an interface?\n\n3. Write from memory a PHP class called `ArticleService` that: uses a namespace, has a constructor that receives `EntityTypeManagerInterface` via DI, has a method `getPublished(int $limit): array` that loads published article nodes, handles the case where no articles exist by returning an empty array.",
            checkGoal: "Evaluate OOP fundamentals for Drupal readiness. Must demonstrate: correct block plugin class structure (BlockBase, ContainerFactoryPluginInterface, create(), build(), blockAccess()), clear interface vs abstract class distinction with real Drupal examples, working ArticleService with correct namespace, constructor property, type hints, and EntityTypeManager usage pattern. Score each question 0-10 with specific feedback.",
          },
        },

      ],
    },

    // ── WEEK 2 ──────────────────────────────────────────────────
    {
      label: "Week 2",
      name: "PHP Patterns Drupal Uses",
      days: [

        // ── Day 8 ────────────────────────────────────────────────
        {
          day: "Day 8",
          title: "Dependency Injection & Service Container Pattern",
          goal: "Deeply understand DI — the most important pattern in Drupal development.",
          reading: [
            { title: "The service container", body: "A registry of reusable objects (services) with their dependencies pre-wired. Drupal's container knows how to build every service in the system — you just ask for what you need.", link: "https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection" },
            { title: "Constructor injection", body: "The preferred pattern: declare dependencies as constructor parameters, store in properties, use in methods. Makes dependencies explicit, enables testing with mocks, follows Dependency Inversion Principle.", link: "https://symfony.com/doc/current/service_container.html" },
            { title: "ContainerInjectionInterface", body: "Controllers and form classes implement this interface and define a static <code>create(ContainerInterface $container): static</code> factory method. The routing system calls <code>create()</code> to instantiate them — no services.yml needed.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Core!DependencyInjection!ContainerInjectionInterface.php" },
            { title: "\\Drupal::service() — when to use it", body: "<code>\\Drupal::service('entity_type.manager')</code> is the service locator anti-pattern — it hides dependencies and makes testing hard. Only acceptable in procedural hooks in .module files where DI isn't possible.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "Why is constructor injection preferred over calling `\\Drupal::service()` inside a class method?", options: ["It's faster at runtime", "It makes dependencies explicit, enables unit testing with mocks, and follows the Dependency Inversion Principle", "`\\Drupal::service()` doesn't work inside classes", "Constructor injection is required by Drupal — `\\Drupal::service()` is forbidden"], answer: 1, explanation: "DI makes the class honest about what it needs, enables testing by swapping real services for fakes, and removes the hidden coupling to the global container." },
              { q: "You're writing a Drupal controller. It needs the `entity_type.manager` service. What is the complete correct pattern?", options: ["$etm = \\Drupal::entityTypeManager(); in each method", "Implement ContainerInjectionInterface, inject via create() factory method, store in constructor property, use $this->entityTypeManager in methods", "Add it to services.yml with @entity_type.manager", "B and C are both needed — controllers need both create() AND services.yml"], answer: 1, explanation: "Controllers use `ContainerInjectionInterface` with a static `create()` factory. They do NOT need a services.yml entry — that's only for services/subscribers/plugins." },
              { q: "What is the difference between a service and a controller in Drupal's DI system?", options: ["No difference — they both need services.yml entries", "Services are registered in services.yml; controllers use ContainerInjectionInterface and are instantiated by the routing system — no services.yml needed", "Controllers cannot use dependency injection", "Services can only be used in controllers"], answer: 1, explanation: "Only services, event subscribers, and plugins need services.yml. Controllers and form classes use `create()` directly." },
              { q: "Your service depends on another custom service `my_module.helper`. How do you declare this in services.yml?", options: ["arguments: ['my_module.helper'] (no @ sign)", "arguments: ['@my_module.helper'] (with @ sign)", "dependencies: ['my_module.helper']", "requires: ['@my_module.helper']"], answer: 1, explanation: "The `@` prefix tells the service container 'this is a service reference, resolve it' rather than treating it as a plain string." },
              { q: "You inject `@current_user` into your service. What type of object do you actually receive?", options: ["The actual User entity object", "A proxy object (AccountProxy) that delegates to the current user dynamically", "A user ID integer", "An exception — you can't inject @current_user directly"], answer: 1, explanation: "`@current_user` injects an `AccountProxy` — a proxy object that delegates to the actual current user at call time. This is why it stays accurate even if the session changes." },
            ],
            title: "Build a ContentService with the full Drupal DI pattern",
            intro: "Implement ContentService following Drupal's exact DI conventions — ContainerInjectionInterface, create() factory, readonly constructor injection, and a unit test that proves mocking works.",
            steps: [
              {
                n: 1,
                title: "Create the ContentService skeleton with the correct namespace",
                body: "Start with just the class shell. The namespace follows PSR-4: `Practice\\Service` maps to `src/Service/`. We'll add the interface and methods in the next steps.",
                code: "<?php\n// practice/src/Service/ContentService.php\ndeclare(strict_types=1);\n\nnamespace Practice\\Service;\n\nclass ContentService {\n}",
              },
              {
                n: 2,
                title: "Add the ContainerInjectionInterface import and declaration",
                body: "By implementing this interface, ContentService tells Drupal's routing/plugin system 'use my create() method to instantiate me, not new ContentService()'. This is what allows the router to call the right constructor with the right services.",
                code: "use Symfony\\Component\\DependencyInjection\\ContainerInterface;\n\nclass ContentService implements \\Drupal\\Core\\DependencyInjection\\ContainerInjectionInterface {\n}",
              },
              {
                n: 3,
                title: "Write the constructor with readonly promoted properties",
                body: "Two injected services declared as `private readonly`. The `readonly` keyword ensures they can never be accidentally overwritten after construction. The constructor ONLY stores them — no logic here.",
                code: "  public function __construct(\n    private readonly \\Drupal\\Core\\Entity\\EntityTypeManagerInterface $entityTypeManager,\n    private readonly \\Psr\\Log\\LoggerInterface $logger\n  ) {}",
              },
              {
                n: 4,
                title: "Write the static create() factory method",
                body: "The container calls this static method, passing itself. `create()` pulls the services by their container IDs and passes them to `new static(...)`. Note `new static()` not `new self()` — this supports subclasses correctly (late static binding).",
                code: "  public static function create(ContainerInterface $container): static {\n    return new static(\n      $container->get('entity_type.manager'),\n      $container->get('logger.factory')->get('practice')\n    );\n  }",
              },
              {
                n: 5,
                title: "Add countPublished() using the entity query API",
                body: "This is a simplified version of the real Drupal entity query pattern. `getStorage('node')` returns the node storage handler. `getQuery()` builds a query object. `accessCheck(TRUE)` is required in Drupal 9.2+ to be explicit about access checks.",
                code: "  public function countPublished(): int {\n    return (int) $this->entityTypeManager\n      ->getStorage('node')\n      ->getQuery()\n      ->accessCheck(TRUE)\n      ->condition('status', 1)\n      ->count()\n      ->execute();\n  }",
              },
              {
                n: 6,
                title: "Write a unit test that mocks the entity type manager",
                body: "This is the payoff of DI. Instead of a real Drupal database, we create mock objects that return controlled values. The test runs in pure PHP — no Drupal bootstrap needed. If we had used `\\Drupal::service()` inside countPublished(), this test would be impossible.",
                code: "<?php\n// practice/tests/ContentServiceTest.php\ndeclare(strict_types=1);\n\nuse PHPUnit\\Framework\\TestCase;\nuse Practice\\Service\\ContentService;\n\nclass ContentServiceTest extends TestCase {\n\n  public function testCountPublishedReturnsInteger(): void {\n    // Build mock chain bottom-up\n    $query = $this->createMock(\\Drupal\\Core\\Entity\\Query\\QueryInterface::class);\n    $query->method('accessCheck')->willReturnSelf();\n    $query->method('condition')->willReturnSelf();\n    $query->method('count')->willReturnSelf();\n    $query->method('execute')->willReturn(42);\n\n    $storage = $this->createMock(\\Drupal\\Core\\Entity\\EntityStorageInterface::class);\n    $storage->method('getQuery')->willReturn($query);\n\n    $etm = $this->createMock(\\Drupal\\Core\\Entity\\EntityTypeManagerInterface::class);\n    $etm->method('getStorage')->with('node')->willReturn($storage);\n\n    $logger  = $this->createMock(\\Psr\\Log\\LoggerInterface::class);\n    $service = new ContentService($etm, $logger);\n\n    $this->assertSame(42, $service->countPublished());\n  }\n}",
              },
              {
                n: 7,
                title: "Run the test with PHPUnit",
                body: "Install PHPUnit as a dev dependency, then run the test. A green dot means the mock correctly intercepted the entity query call and returned 42. If you get 'class not found' errors, you need to require the Drupal interfaces via `composer require --dev drupal/core-recommended` or mock them manually.",
                code: "cd practice && composer require --dev phpunit/phpunit\n./vendor/bin/phpunit tests/ContentServiceTest.php\n# Expected:\n# .  1 / 1 (100%)\n# OK (1 test, 1 assertion)",
              },
            ],
            aiCheck: {
              prompt: "Paste ContentService.php and ContentServiceTest.php, and the PHPUnit output.",
              checkGoal: "Verify: class implements ContainerInjectionInterface, constructor has two readonly promoted properties, create() uses new static() not new self(), countPublished() chains getStorage/getQuery/accessCheck/condition/count/execute, test mocks EntityTypeManagerInterface and verifies countPublished() returns 42 without a real Drupal instance. PHPUnit output must show 1 passing test.",
            },
          },
        },

        // ── Day 9 ────────────────────────────────────────────────
        {
          day: "Day 9",
          title: "PHP Arrays & Array Functions Drupal Uses",
          goal: "Be fast with PHP array manipulation — Drupal render arrays, entity queries, and config are all arrays.",
          reading: [
            { title: "Core array functions", body: "<code>array_map()</code> — transform each element. <code>array_filter()</code> — keep elements matching a condition. <code>array_reduce()</code> — fold into a single value. <code>array_column()</code> — extract one field from a list of records.", link: "https://www.php.net/manual/en/ref.array.php" },
            { title: "Merge operators", body: "<code>array_merge()</code> — RIGHT side wins duplicate keys. <code>+</code> operator — LEFT side wins. Drupal uses <code>+</code> in hooks to set defaults: <code>$variables += ['myvar' => 'default']</code>. Get this wrong and you'll silently overwrite data.", link: null },
            { title: "Drupal render arrays", body: "All Drupal output is a PHP array: <code>['#type' => 'textfield', '#title' => 'Name', '#required' => TRUE]</code>. Keys prefixed with <code>#</code> are render properties. Non-<code>#</code> keys are child elements. Passed to <code>render()</code> to produce HTML.", link: null },
            { title: "NestedArray::mergeDeep()", body: "Drupal's utility for deep array merges — intelligently merges nested arrays without losing sub-keys. <code>array_merge_recursive()</code> creates duplicate-value arrays which breaks render arrays. Always use NestedArray::mergeDeep() for render arrays.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Component!Utility!NestedArray.php" },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "You have `$a = ['key' => 1]` and `$b = ['key' => 2, 'other' => 3]`. What does `$a + $b` produce?", options: ["['key' => 2, 'other' => 3] — $b wins", "['key' => 1, 'other' => 3] — $a wins for duplicate keys", "['key' => 3, 'other' => 3] — values are added", "['key' => 1, 'key' => 2, 'other' => 3] — both keys kept"], answer: 1, explanation: "The `+` operator keeps the LEFT array's values for duplicate keys. Drupal uses `+` in hooks: `$variables += ['myvar' => 'default']` sets a default only if the key doesn't already exist." },
              { q: "You want to remove all empty strings from an array `$values`. Which is most concise?", options: ["foreach ($values as $k => $v) { if ($v === '') unset($values[$k]); }", "$values = array_filter($values, fn($v) => $v !== '');", "$values = array_map('trim', $values);", "$values = array_diff($values, ['']);"], answer: 1, explanation: "`array_filter()` with a callback is the idiomatic approach. Without a callback, `array_filter()` removes all falsy values." },
              { q: "A Drupal form `buildForm()` must return an array. Which is a valid render array for a text input?", options: ["return ['<input type=\"text\" name=\"title\">']", "return ['title' => ['#type' => 'textfield', '#title' => 'Title', '#required' => TRUE]]", "return new TextfieldElement('title')", "return ['title' => 'textfield']"], answer: 1, explanation: "Drupal render arrays use associative arrays with `#`-prefixed keys for render properties. The non-`#` keys are child elements." },
              { q: "You need to merge two deeply nested render arrays without losing nested values. What Drupal utility should you use?", options: ["array_replace_recursive()", "array_merge_recursive()", "NestedArray::mergeDeep()", "Just use + operator"], answer: 2, explanation: "`NestedArray::mergeDeep()` is Drupal's utility for intelligently merging deeply nested arrays. `array_merge_recursive()` creates duplicate-value arrays rather than overwriting, which breaks render arrays." },
            ],
            title: "Array manipulation exercises",
            intro: "Work through the six array operations Drupal uses every day — each step builds on the last using the same dataset.",
            steps: [
              {
                n: 1,
                title: "Create arrays.php and define the sample dataset",
                body: "This dataset simulates what you'd get back from a Drupal entity query — an array of associative arrays. Each element has an id, title, status (1=published, 0=draft), and a tags sub-array.",
                code: "<?php\ndeclare(strict_types=1);\n\n$nodes = [\n  ['id' => 1, 'title' => 'Drupal Guide',    'status' => 1, 'tags' => ['drupal', 'cms']],\n  ['id' => 2, 'title' => 'PHP Tips',         'status' => 0, 'tags' => ['php']],\n  ['id' => 3, 'title' => 'Composer Setup',   'status' => 1, 'tags' => ['drupal', 'php']],\n  ['id' => 4, 'title' => 'Twig Templates',   'status' => 1, 'tags' => ['drupal', 'twig']],\n  ['id' => 5, 'title' => 'Unpublished Post', 'status' => 0, 'tags' => ['misc']],\n];",
              },
              {
                n: 2,
                title: "Filter to published nodes only with array_filter()",
                body: "`array_filter()` calls your callback for each element and keeps elements where the callback returns true. The arrow function `fn($n) => ...` is PHP 7.4+ shorthand. Note: array_filter preserves original keys — use array_values() if you need re-indexed keys.",
                code: "$published = array_filter($nodes, fn($n) => $n['status'] === 1);\n\nvar_dump(count($published)); // int(3)\nvar_dump(array_values($published)[0]['title']); // string(12) \"Drupal Guide\"",
              },
              {
                n: 3,
                title: "Extract just the titles with array_column()",
                body: "`array_column($array, 'fieldName')` pulls one field from each sub-array. Much cleaner than a foreach loop. The third argument (omitted here) would set the index key.",
                code: "$titles = array_column($published, 'title');\nvar_dump($titles);\n// Expected: array(3) {\n//   [0]=> string(12) \"Drupal Guide\"\n//   [1]=> string(14) \"Composer Setup\"\n//   [2]=> string(13) \"Twig Templates\"\n// }",
              },
              {
                n: 4,
                title: "Build an id => title map",
                body: "Passing a third argument to array_column() sets the index key. This produces an associative array keyed by id — exactly what you'd use to build a select list in a Drupal form.",
                code: "$map = array_column($published, 'title', 'id');\nvar_dump($map);\n// Expected: array(3) {\n//   [1]=> string(12) \"Drupal Guide\"\n//   [3]=> string(14) \"Composer Setup\"\n//   [4]=> string(13) \"Twig Templates\"\n// }",
              },
              {
                n: 5,
                title: "Collect, flatten, and deduplicate all tags",
                body: "`array_column($nodes, 'tags')` gives you an array of arrays. The spread operator `...` unpacks them so `array_merge()` flattens into one array. `array_unique()` removes duplicates, and `array_values()` re-indexes the result.",
                code: "$nested = array_column($nodes, 'tags');       // [[drupal,cms],[php],...]  \n$flat   = array_merge(...$nested);            // [drupal,cms,php,drupal,...]\n$unique = array_values(array_unique($flat));  // [drupal,cms,php,twig,misc]\n\nvar_dump($unique);\n// Expected: array(5) with values drupal, cms, php, twig, misc (no duplicates)",
              },
              {
                n: 6,
                title: "Sort nodes alphabetically by title with usort()",
                body: "`usort()` sorts in place (modifies the array). The comparison function receives two elements; `strcmp()` compares strings. After sorting, `$nodes[0]` should be 'Composer Setup' (C comes first).",
                code: "usort($nodes, fn($a, $b) => strcmp($a['title'], $b['title']));\n\necho $nodes[0]['title'] . PHP_EOL; // Composer Setup\necho $nodes[1]['title'] . PHP_EOL; // Drupal Guide\necho $nodes[4]['title'] . PHP_EOL; // Unpublished Post",
              },
              {
                n: 7,
                title: "Demonstrate the + vs array_merge difference",
                body: "This is critical for Drupal hooks. The `+` operator preserves LEFT side values — use it for defaults. `array_merge()` lets RIGHT side values win — use it when you want to override. Getting this wrong in a hook_preprocess_ function silently corrupts data.",
                code: "$defaults = ['color' => 'blue', 'size' => 'medium'];\n$overrides = ['color' => 'red', 'weight' => 'heavy'];\n\n$withPlus  = $defaults + $overrides;\n$withMerge = array_merge($defaults, $overrides);\n\nvar_dump($withPlus['color']);  // string(4) \"blue\"  — LEFT wins\nvar_dump($withMerge['color']); // string(3) \"red\"   — RIGHT wins",
              },
              {
                n: 8,
                title: "Build a Drupal-style render array",
                body: "A Drupal render array uses `#`-prefixed keys for render properties. `#items` is an array of child render arrays, each with `#markup`. This is the real structure passed to Drupal's renderer — not HTML strings.",
                code: "function buildRenderArray(array $nodes): array {\n  return [\n    '#theme'  => 'item_list',\n    '#title'  => 'Published Nodes',\n    '#items'  => array_map(\n      fn($n) => ['#markup' => htmlspecialchars($n['title'])],\n      $nodes\n    ),\n  ];\n}\n\n$renderArray = buildRenderArray($published);\nvar_dump(count($renderArray['#items'])); // int(3)\nvar_dump($renderArray['#items'][0]);     // array with #markup key",
              },
            ],
            aiCheck: {
              prompt: "Paste arrays.php with all 8 steps and the full output.",
              checkGoal: "Verify: array_filter keeps exactly 3 published nodes, array_column extracts titles in correct order, id=>title map uses numeric ids as keys, tags flatten to 5 unique values, usort places Composer Setup first, + operator preserves left value while array_merge takes right value, render array has #theme/#title/#items with #markup sub-arrays.",
            },
          },
        },

        // ── Day 10 ────────────────────────────────────────────────
        {
          day: "Day 10",
          title: "PHP Strings, Regular Expressions & Sanitization",
          goal: "Handle strings safely — critical for Drupal security (XSS, SQL injection prevention).",
          reading: [
            { title: "Modern PHP string functions", body: "PHP 8 added <code>str_contains()</code>, <code>str_starts_with()</code>, <code>str_ends_with()</code>. Use these over <code>strpos()</code> for clarity. <code>sprintf()</code> for formatted strings — safer and more readable than concatenation.", link: "https://www.drupal.org/docs/security-in-drupal/writing-secure-code-for-drupal" },
            { title: "Sanitization in Drupal", body: "<code>Html::escape()</code> — HTML-encode a string. <code>Xss::filter()</code> — strip dangerous HTML tags. <code>Xss::filterAdmin()</code> — allow more tags for trusted admin content. NEVER output user input directly — always sanitize.", link: "https://api.drupal.org/api/drupal/core!lib!Drupal!Component!Utility!Xss.php" },
            { title: "The @, %, : variables in t()", body: "<code>@variable</code> — HTML-escapes the value (safe for text). <code>%variable</code> — escapes AND wraps in &lt;em&gt;. <code>:variable</code> — for URLs, runs through Url::fromUri(). Always use these instead of string concatenation in translatable strings.", link: null },
            { title: "Regular expressions", body: "<code>preg_match('/pattern/', $str)</code> — test. <code>preg_replace('/pattern/', $replacement, $str)</code> — replace. <code>preg_split('/pattern/', $str)</code> — split. Drupal uses regex for URL path matching, machine name validation, and text processing.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "A user enters `<script>alert('xss')</script>` as their name. You output it as `$this->t('Welcome @name', ['@name' => $user_input])`. What happens?", options: ["The script executes — XSS vulnerability", "The `@` placeholder HTML-encodes the value — the script tag is rendered as text, not executed", "Drupal throws an exception for unsafe input", "The output is an empty string"], answer: 1, explanation: "`@variable` in `t()` runs the value through `Html::escape()` automatically. Always use `@` (or `%`) for user-supplied values in translatable strings." },
              { q: "When should you use `Xss::filterAdmin()` instead of `Xss::filter()`?", options: ["Always — filterAdmin() is safer", "filterAdmin() allows more HTML tags (tables, images, etc.) — use it only for trusted admin-entered content, never for user-submitted content", "filterAdmin() is for admin pages only — filter() is for frontend", "They produce identical output"], answer: 1, explanation: "`Xss::filter()` strips almost all HTML. `Xss::filterAdmin()` allows a broader set of tags appropriate for admin-entered markup. Using `filterAdmin()` on user content is a security risk." },
              { q: "You need to validate that a string is a valid machine name (lowercase letters, numbers, underscores only). Which approach is correct?", options: ["if ($name == strtolower($name))", "if (preg_match('/^[a-z0-9_]+$/', $name))", "if (ctype_alnum($name))", "if (strlen($name) > 0)"], answer: 1, explanation: "Regular expression with anchors `^` and `$` validates the complete string format. `ctype_alnum()` would exclude underscores. This is exactly how Drupal validates machine names." },
              { q: "You display a node body field that an editor entered. The field uses 'Full HTML' text format. Which is the correct way to output it in a Twig template?", options: ["{{ node.body.value }}", "{{ node.body.value|raw }}", "{{ content.body }} — render through Drupal's render system", "{{ node.body.value|escape }}"], answer: 2, explanation: "`content.body` goes through Drupal's render pipeline which applies the configured text format filters. Outputting `node.body.value|raw` bypasses ALL security filtering — never do this." },
            ],
            title: "Build three utility functions for safe string handling",
            intro: "Implement sanitizeUserInput(), generateMachineName(), and truncateSummary() — the kind of helpers you'd extract into a utility class in a real Drupal module.",
            steps: [
              {
                n: 1,
                title: "Create strings.php and test an XSS payload without sanitization",
                body: "First, see the problem. Output raw user input and observe that the script tag would execute in a browser. This is why every piece of user input must be sanitized before output.",
                code: "<?php\ndeclare(strict_types=1);\n\n$userInput = \"<script>alert('xss')</script>\";\n\n// DANGEROUS — never do this:\necho $userInput . PHP_EOL;\n// Output: <script>alert('xss')</script>  — would execute in browser!\n\n// SAFE — htmlspecialchars encodes the < and > characters:\necho htmlspecialchars($userInput, ENT_QUOTES | ENT_HTML5, 'UTF-8') . PHP_EOL;\n// Output: &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt; — displayed as text",
              },
              {
                n: 2,
                title: "Write sanitizeUserInput() step by step",
                body: "Build the function in logical order: trim whitespace, escape HTML entities, strip any remaining HTML tags, return empty string if nothing is left. Each step adds a layer of protection.",
                code: "function sanitizeUserInput(string $input): string {\n  // Step 1: remove leading/trailing whitespace\n  $trimmed = trim($input);\n\n  // Step 2: convert HTML special characters to entities\n  $escaped = htmlspecialchars($trimmed, ENT_QUOTES | ENT_HTML5, 'UTF-8');\n\n  // Step 3: strip any remaining HTML tags\n  $stripped = strip_tags($escaped);\n\n  // Step 4: return empty string for blank input\n  return $stripped === '' ? '' : $stripped;\n}",
              },
              {
                n: 3,
                title: "Test sanitizeUserInput() with three cases",
                body: "Test with: normal text (should pass through cleanly), an XSS payload (should be neutralised), and whitespace-only input (should return empty string).",
                code: "var_dump(sanitizeUserInput('  Hello World  '));\n// string(11) \"Hello World\"\n\nvar_dump(sanitizeUserInput(\"<script>alert('xss')</script>\"));\n// string(55) \"&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;\"\n// (or empty string if strip_tags removed everything)\n\nvar_dump(sanitizeUserInput('   '));\n// string(0) \"\"",
              },
              {
                n: 4,
                title: "Write generateMachineName()",
                body: "Machine names in Drupal must be lowercase, contain only letters/numbers/underscores, and not start or end with an underscore. Build it in four clear steps, each with a single responsibility.",
                code: "function generateMachineName(string $label): string {\n  // 1. Lowercase everything\n  $lower = strtolower($label);\n\n  // 2. Replace spaces with underscores\n  $underscored = str_replace(' ', '_', $lower);\n\n  // 3. Remove all characters that aren't a-z, 0-9, or _\n  $clean = preg_replace('/[^a-z0-9_]/', '', $underscored);\n\n  // 4. Trim leading/trailing underscores\n  return trim((string) $clean, '_');\n}",
              },
              {
                n: 5,
                title: "Test generateMachineName() with four inputs",
                body: "Verify these exact outputs. If any differ, check your regex — a common mistake is using `[^a-z0-9_]+` (one or more) which collapses multiple consecutive invalid characters into a single pass but still leaves underscores from spaces.",
                code: "var_dump(generateMachineName('My Module Name!!'));\n// string(14) \"my_module_name\"\n\nvar_dump(generateMachineName('Drupal 10 Module'));\n// string(15) \"drupal_10_module\"\n\nvar_dump(generateMachineName('  --Hello World--  '));\n// string(11) \"hello_world\"\n\nvar_dump(generateMachineName('123 Numbers First'));\n// string(17) \"123_numbers_first\"",
              },
              {
                n: 6,
                title: "Write truncateSummary()",
                body: "Three cases: text shorter than limit returns as-is, text longer than limit gets cut at the nearest word boundary (not mid-word), and HTML tags are stripped first so we don't count them in the length.",
                code: "function truncateSummary(string $text, int $maxLength = 200): string {\n  // Strip HTML tags so we measure visible text length\n  $plain = strip_tags($text);\n\n  // If it fits, return as-is\n  if (strlen($plain) <= $maxLength) {\n    return $plain;\n  }\n\n  // Cut at maxLength, then find the last space to avoid mid-word cuts\n  $cut       = substr($plain, 0, $maxLength);\n  $lastSpace = strrpos($cut, ' ');\n\n  return ($lastSpace !== false ? substr($cut, 0, $lastSpace) : $cut) . '...';\n}",
              },
              {
                n: 7,
                title: "Test truncateSummary() with edge cases",
                body: "Test: short text (no truncation), long text (truncated at word boundary, not mid-word), and HTML input (tags stripped before measuring). The key assertion: the truncated result must not cut a word in half.",
                code: "// Short text — no truncation\nvar_dump(truncateSummary('Short text.', 200));\n// string(11) \"Short text.\"\n\n// Long text — truncated at word boundary\n$long = 'The quick brown fox jumps over the lazy dog and then runs away into the forest.';\nvar_dump(truncateSummary($long, 30));\n// string(23) \"The quick brown fox...\"  (cuts before 'jumps' which would exceed 30)\n\n// HTML input — tags stripped first\nvar_dump(truncateSummary('<p><strong>Bold intro</strong> followed by more text that goes on for a while.</p>', 20));\n// string(16) \"Bold intro...\" (or similar — tags not counted)",
              },
            ],
            aiCheck: {
              prompt: "Paste all three functions and the output of all test cases.",
              checkGoal: "Verify: sanitizeUserInput trims, escapes HTML entities, strips tags, returns empty for whitespace-only; generateMachineName produces exact outputs my_module_name / drupal_10_module / hello_world / 123_numbers_first; truncateSummary returns short text unchanged, truncates long text at word boundary with ellipsis, strips HTML tags before measuring length.",
            },
          },
        },

        // ── Day 11 ────────────────────────────────────────────────
        {
          day: "Day 11",
          title: "PHP 8 Features Drupal 10/11 Uses",
          goal: "Be comfortable with modern PHP syntax used throughout Drupal 10/11 source code.",
          reading: [
            { title: "Named arguments & match expressions", body: "Named arguments: <code>array_slice(array: $items, offset: 0, length: 5)</code>. Match expressions: strict comparison, returns a value, throws <code>UnhandledMatchError</code> if no arm matches — safer than switch.", link: "https://stitcher.io/blog/new-in-php-8" },
            { title: "Nullsafe operator", body: "<code>$user?->getProfile()?->getEmail()</code> — if any object in the chain is null, the whole expression short-circuits to null instead of throwing a fatal error. Common in Drupal entity field access where values may not exist.", link: "https://www.php.net/releases/8.0/en.php" },
            { title: "Constructor property promotion", body: "<code>public function __construct(private readonly EntityTypeManagerInterface $etm) {}</code> — combines property declaration, constructor parameter, and assignment in one. Drupal 10.2+ uses this heavily.", link: "https://www.php.net/releases/8.1/en.php" },
            { title: "PHP 8.1 features", body: "<code>readonly</code> properties — can only be set once during construction. Enums — <code>enum Status { case Draft; case Published; }</code> starting to appear in Drupal 11. <code>#[Attribute]</code> native attributes — Drupal uses <code>#[Hook]</code>, <code>#[Route]</code> in newer versions.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "What does this code do: `$email = $user?->getProfile()?->getEmail() ?? 'no-email@example.com'`?", options: ["Throws an exception if $user is null", "Safely returns the email if user and profile exist, otherwise returns the fallback string", "Only works if $user implements a specific interface", "`?->` is not valid PHP syntax"], answer: 1, explanation: "The nullsafe operator `?->` short-circuits the chain to `null` if any object in the chain is null. The `??` null coalescing operator then provides the fallback." },
              { q: "Which is a valid PHP 8.1 constructor property promotion?", options: ["class Foo { public function __construct(public readonly string $name) {} } — promotion", "class Foo { public string $name; public function __construct(string $name) { $this->name = $name; } } — traditional", "Both are equivalent", "Constructor promotion only works with readonly"], answer: 2, explanation: "Both are exactly equivalent. Constructor promotion is syntactic sugar. Drupal 10.2+ prefers promotion for cleaner code." },
              { q: "What is the key difference between `match` and `switch` in PHP 8?", options: ["match uses strict comparison (===); switch uses loose comparison (==)", "match is an expression that returns a value; switch is a statement", "match throws UnhandledMatchError if no arm matches; switch falls through silently", "All of the above"], answer: 3, explanation: "All three are real differences. `match` is safer (strict, throws on no match, returns value). Drupal 10+ uses `match` in many places where `switch` was used before." },
              { q: "You see: `public function __construct(private readonly LoggerInterface $logger) {}`. What does `private readonly` mean combined?", options: ["The property is private (only this class) AND can only be set once during construction", "private and readonly cancel each other out", "readonly makes it public despite private", "This is a syntax error"], answer: 0, explanation: "`private` restricts access to the class itself. `readonly` prevents modification after construction. Together: an immutable private dependency — perfect for injected services that should never change." },
            ],
            title: "Modernise your practice code with PHP 8 features",
            intro: "Refactor Node and ContentService using PHP 8.1 syntax — matching how Drupal 10.2+ source code actually looks.",
            steps: [
              {
                n: 1,
                title: "Compare old vs new constructor — side by side",
                body: "Before touching any code, understand what constructor property promotion saves. Write both versions in a scratch file and confirm they produce identical behaviour.",
                code: "<?php\n// OLD pattern — 3 separate steps:\nclass OldStyle {\n  protected string $title;\n  protected string $body;\n  public function __construct(string $title, string $body) {\n    $this->title = $title;\n    $this->body  = $body;\n  }\n}\n\n// NEW pattern — 1 step (PHP 8+ constructor property promotion):\nclass NewStyle {\n  public function __construct(\n    protected string $title,\n    protected string $body\n  ) {}\n}\n\n// Both behave identically:\n$old = new OldStyle('Hello', 'World');\n$new = new NewStyle('Hello', 'World');",
              },
              {
                n: 2,
                title: "Rewrite Node.php using constructor property promotion",
                body: "Replace the four property declarations and the four `$this->x = $x` lines in the constructor with promoted properties. Keep the `?: time()` defaulting logic in the constructor body — that can't be promoted.",
                code: "class Node implements ContentInterface {\n  use LoggingTrait;\n\n  public function __construct(\n    protected string $title,\n    protected string $body,\n    protected bool   $status    = true,\n    protected int    $createdAt = 0\n  ) {\n    if ($this->createdAt === 0) {\n      $this->createdAt = time();\n    }\n  }\n\n  // All getters and other methods remain unchanged\n}",
              },
              {
                n: 3,
                title: "Add getStatusLabel() using match",
                body: "Replace a switch with a match expression. Notice: match uses `===` (strict), returns a value directly (no `break` needed), and throws `UnhandledMatchError` if none of the arms match — unlike switch which silently falls through.",
                code: "  public function getStatusLabel(): string {\n    return match((int) $this->status) {\n      1       => 'published',\n      0       => 'draft',\n      default => 'unknown',\n    };\n  }\n\n// Test:\n$node = new Node('Test', 'Body', true);\necho $node->getStatusLabel() . PHP_EOL; // published\n\n$node->unpublish();\necho $node->getStatusLabel() . PHP_EOL; // draft",
              },
              {
                n: 4,
                title: "Rewrite ContentService constructor with readonly promotion",
                body: "The combination of `private readonly` and promotion is the modern Drupal pattern. It means: (1) the property is declared, (2) it's injected via constructor, (3) it's stored, (4) it can never be changed — all in one line.",
                code: "class ContentService implements \\Drupal\\Core\\DependencyInjection\\ContainerInjectionInterface {\n\n  // Before (3-step pattern):\n  // private EntityTypeManagerInterface $entityTypeManager;\n  // public function __construct(EntityTypeManagerInterface $etm) {\n  //   $this->entityTypeManager = $etm;\n  // }\n\n  // After (promoted readonly):\n  public function __construct(\n    private readonly \\Drupal\\Core\\Entity\\EntityTypeManagerInterface $entityTypeManager,\n    private readonly \\Psr\\Log\\LoggerInterface $logger\n  ) {}\n}",
              },
              {
                n: 5,
                title: "Use the nullsafe operator in a helper method",
                body: "The nullsafe operator prevents null pointer fatals in chains. Without it you'd need nested if($obj !== null) checks. With it, the entire chain short-circuits to null at the first null.",
                code: "// Simulated nested objects:\nclass Profile {\n  public function __construct(private ?string $email = null) {}\n  public function getEmail(): ?string { return $this->email; }\n}\n\nclass UserAccount {\n  public function __construct(private ?Profile $profile = null) {}\n  public function getProfile(): ?Profile { return $this->profile; }\n}\n\n// With profile:\n$user1 = new UserAccount(new Profile('user@example.com'));\necho $user1?->getProfile()?->getEmail() ?? 'no email'; // user@example.com\n\n// Without profile (null in the chain):\n$user2 = new UserAccount(null);\necho $user2?->getProfile()?->getEmail() ?? 'no email'; // no email\n\n// Null user:\n$user3 = null;\necho $user3?->getProfile()?->getEmail() ?? 'no email'; // no email",
              },
              {
                n: 6,
                title: "Run your existing tests to confirm refactoring didn't break anything",
                body: "Refactoring should never change behaviour — only the syntax. Run all your previous test files. If any fail, compare the old and new constructor parameter order — a common mistake is accidentally reordering promoted properties.",
                code: "php practice/test.php          # Node test\nphp practice/test_article.php  # Article test  \nphp practice/test_interface.php # Interface test\nphp practice/index.php         # Autoloading test\n# All should produce identical output to before the refactor",
              },
            ],
            aiCheck: {
              prompt: "Paste the refactored Node.php constructor and ContentService.php constructor, plus the output of all test files after refactoring.",
              checkGoal: "Verify: Node constructor uses property promotion (no separate property declarations for the four fields), getStatusLabel() uses match not switch, ContentService constructor uses private readonly promoted properties with no separate declaration lines, nullsafe operator demo shows null chain returning 'no email' without fatal error. All existing tests still pass with identical output.",
            },
          },
        },

        // ── Day 12 ────────────────────────────────────────────────
        {
          day: "Day 12",
          title: "Composer & Autoloading Deep Dive",
          goal: "Understand Composer well enough to manage any Drupal project dependency situation.",
          reading: [
            { title: "Version constraints", body: "<code>^1.2</code> — compatible, allows 1.x.x but not 2.x. <code>~1.2</code> — allows 1.2.x only. <code>*</code> — anything. Exact: <code>1.2.3</code>. The <code>^</code> caret is what you'll see everywhere in Drupal: <code>^10.2</code> = >=10.2.0 <11.0.0.", link: "https://getcomposer.org/doc/" },
            { title: "install vs update", body: "<code>composer install</code> — reads <code>composer.lock</code>, installs exactly those versions. <code>composer update</code> — recalculates from <code>composer.json</code>, may change versions. Always commit both files. <code>composer install --no-dev</code> for production.", link: "https://www.drupal.org/docs/develop/using-composer/manage-dependencies" },
            { title: "Patching with composer-patches", body: "<code>cweagans/composer-patches</code> applies patches automatically on every install/update. Define in <code>extra.patches</code>. The patch is version-controlled, applied consistently, and can be removed when upstream fixes land. Never edit files in <code>vendor/</code>.", link: null },
            { title: "Useful diagnostic commands", body: "<code>composer show drupal/core</code> — inspect installed package. <code>composer why package/name</code> — why is it installed. <code>composer outdated</code> — which packages have updates. <code>composer diagnose</code> — check for issues.", link: null },
          ],
          activity: {
            type: "combined",
            questions: [
              { q: "Your `composer.json` has `\"drupal/core\": \"^10.2\"`. What version range does this allow?", options: ["Exactly 10.2.0 only", "10.2.0 and above, but less than 11.0.0", "10.2.0 and above including 11.x", "Any version of drupal/core"], answer: 1, explanation: "`^` means compatible: allows MINOR and PATCH updates but not the next MAJOR version. `^10.2` = `>=10.2.0 <11.0.0`." },
              { q: "A new developer clones your repo and runs `composer install`. Which file determines exactly what gets installed?", options: ["composer.json — the version constraints", "composer.lock — the exact locked versions", "Whichever is newer", "Both files are consulted equally"], answer: 1, explanation: "`composer install` reads `composer.lock` and installs exactly those versions. This guarantees every developer and every deployment gets identical dependencies." },
              { q: "You need to apply a patch to `drupal/views_bulk_operations` while waiting for an upstream fix. What is the correct approach?", options: ["Edit the file directly in vendor/", "Fork the repo and change composer.json to point to your fork", "Use cweagans/composer-patches — define the patch in composer.json extra.patches section", "Copy the module to modules/custom/ and edit it there"], answer: 2, explanation: "`cweagans/composer-patches` applies patches automatically on every `composer install`/`update`. The patch is version-controlled and can be removed when the upstream fix lands." },
              { q: "You run `composer require drupal/devel` and then deploy to production running `composer install --no-dev`. Is Devel installed?", options: ["Yes — require always installs", "No — --no-dev skips dev dependencies", "It depends on whether devel is in require or require-dev", "--no-dev only affects PHP packages, not Drupal modules"], answer: 2, explanation: "`composer require drupal/devel` adds to `require` (always installed). `composer require --dev drupal/devel` adds to `require-dev` (skipped with `--no-dev`). Devel should always be `--dev`." },
            ],
            title: "Composer diagnostic and project management workflow",
            intro: "Run through the Composer commands you'll use every day on a Drupal project. Requires a running DDEV Drupal site.",
            steps: [
              {
                n: 1,
                title: "Open the project terminal and confirm Composer version",
                body: "Run these two commands to confirm your environment. Drupal 10+ requires Composer 2.x — Composer 1.x produces incorrect dependency resolution and should never be used.",
                code: "ddev ssh\ncomposer --version\n# Expected: Composer version 2.x.x\n\nphp --version\n# Expected: PHP 8.1.x or higher",
              },
              {
                n: 2,
                title: "Check for outdated packages",
                body: "`composer outdated` compares installed versions against the latest available within your constraints. Direct dependencies are highlighted. Do NOT run `composer update` now — just observe what's available.",
                code: "ddev composer outdated\n# Column meanings:\n# yellow  = semver-compatible update available (safe)\n# red     = major version update (breaking changes possible)\n# Note the current vs latest versions for 2-3 packages",
              },
              {
                n: 3,
                title: "Inspect drupal/core in detail",
                body: "`composer show` gives you the full picture of an installed package: its version, description, dependencies, and what requires it. This is how you confirm which exact version is installed and what it needs.",
                code: "ddev composer show drupal/core\n# Note the following in the output:\n# - name: drupal/core\n# - versions: x.x.x\n# - requires: (list of dependencies)\n# - required by: drupal/core-recommended (or similar)",
              },
              {
                n: 4,
                title: "Trace why a package is installed with composer why",
                body: "`composer why` traces the dependency chain. When you see an unfamiliar package in vendor/, this tells you which of YOUR dependencies pulled it in. Useful when you want to remove a transitive dependency.",
                code: "ddev composer why drupal/core-composer-scaffold\n# Expected: shows the package that requires it (likely drupal/core or drupal/recommended-project)\n\nddev composer why symfony/console\n# Expected: drush/drush requires symfony/console (or similar chain)",
              },
              {
                n: 5,
                title: "Add drupal/devel as a dev-only dependency",
                body: "Dev dependencies are installed locally but excluded from production with `--no-dev`. Devel generates debug output — it must NEVER be installed on production. The `--dev` flag places it under `require-dev` in composer.json.",
                code: "ddev composer require --dev drupal/devel\nddev drush en devel -y\n\n# Verify placement — devel must be under require-dev, NOT require:\ngrep -A5 '\"require-dev\"' composer.json\n# Expected:\n# \"require-dev\": {\n#   \"drupal/devel\": \"^5.0\"\n# }",
              },
              {
                n: 6,
                title: "Confirm --no-dev excludes devel",
                body: "Simulate a production install in a temp directory. Running `composer install --no-dev` should not create the devel module directory — proving it's correctly classified as a dev dependency.",
                code: "# In a SEPARATE temp directory — don't run this in your actual project\nmkdir /tmp/composer-test && cd /tmp/composer-test\ncp /path/to/project/composer.json .\ncp /path/to/project/composer.lock .\ncomposer install --no-dev\nls vendor/drupal/ | grep devel\n# Expected: no output — devel not installed without --dev",
              },
              {
                n: 7,
                title: "Add composer scripts for your team",
                body: "Composer scripts automate repeated commands. Add a `drupal-rebuild` script that clears caches after install — your team runs `composer drupal-rebuild` instead of remembering the full drush command.",
                code: "// In composer.json — add/update the scripts section:\n\"scripts\": {\n  \"post-install-cmd\": [\n    \"@composer drupal-rebuild\"\n  ],\n  \"drupal-rebuild\": [\n    \"ddev drush cr\",\n    \"@php -r \\\"echo 'Rebuild complete.\\\\n';\\\"\"\n  ]\n}\n\n// Test it:\nddev composer run drupal-rebuild\n// Expected: Cache rebuild output from drush cr, then 'Rebuild complete.'",
              },
            ],
            aiCheck: {
              prompt: "Paste: (1) output of `composer outdated` listing at least 2 packages, (2) the require-dev section of composer.json showing drupal/devel, (3) the scripts section of composer.json.",
              checkGoal: "Verify: drupal/devel is under require-dev not require, scripts section exists with at least a drupal-rebuild entry that runs drush cr, student can explain what composer why output shows and what outdated columns mean. Bonus: --no-dev test confirms devel excluded.",
            },
          },
        },

        // ── Day 13 ────────────────────────────────────────────────
        {
          day: "Day 13",
          title: "Phase 0 Final Review",
          goal: "Confirm PHP foundations are solid before entering Drupal-specific content.",
          reading: [],
          activity: {
            type: "ai_open",
            prompt: "Answer all four without notes:\n\n1. You're handed a Drupal module file containing: `class MyBlock extends BlockBase implements ContainerFactoryPluginInterface`. Explain every part of that declaration — what `extends` gives you, what `implements` requires you to do, and why `ContainerFactoryPluginInterface` specifically is used for blocks that need services.\n\n2. Write a complete PHP class from memory: `EntityRepository` — namespace `Drupal\\my_module\\Repository`, constructor receives `EntityTypeManagerInterface` and `LoggerInterface` via DI with constructor property promotion and readonly, a method `findPublishedByType(string $type, int $limit = 10): array` that queries and returns entities, proper exception handling if the entity type doesn't exist.\n\n3. Explain step-by-step what happens when you run `ddev composer require drupal/token` — from the command through to the module being available in your Drupal site.\n\n4. A junior developer on your team wrote: `echo $_GET['user_input'];` in a Drupal template. What's wrong with this, what attack does it enable, and how would you fix it properly using Drupal's APIs?",
            checkGoal: "Evaluate PHP readiness for Drupal. Must demonstrate: (1) correct BlockBase/ContainerFactoryPluginInterface explanation with create() and build() methods, (2) EntityRepository with correct namespace, readonly constructor promotion, type-safe return, entity query pattern, exception handling, (3) full Composer flow: downloads package, updates composer.lock, registers PSR-4 autoloading — then drush en to install, (4) identifies XSS attack, explains Html::escape() or t() with @variable as the fix. Score 0-10 per question.",
          },
        },

      ],
    },
  ],
};
