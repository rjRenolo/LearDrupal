#!/usr/bin/env tsx
/**
 * Replace Phase 0 Week 2 content in the database with the corrected
 * "Pure PHP Refresher" curriculum (Days 8–13).
 *
 * Usage: npm run db:update-p0w2
 */

import { Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck } from "../lib/db";
import { initDatabase } from "../lib/sequelize";

interface RItem  { title: string; body: string; link?: string | null }
interface QItem  { q: string; options: string[]; answer: number; explanation: string }
interface SItem  { n: number; title: string; body?: string; code?: string }
interface AiItem { prompt: string; checkGoal: string }

interface NewDay {
  day: string;
  title: string;
  goal: string;
  reading: RItem[];
  activity: {
    type: "quiz" | "hands_on" | "ai_open" | "combined";
    title?: string;
    intro?: string;
    questions?: QItem[];
    steps?: SItem[];
    aiCheck?: AiItem;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Day 8 — Dependency Injection
// ─────────────────────────────────────────────────────────────────────────────
const DAY8: NewDay = {
  day: "Day 8",
  title: "Dependency Injection",
  goal: "Understand dependency injection as a plain PHP pattern — what problem it solves, how to implement it, and why it produces better code than creating dependencies inside a class.",
  reading: [
    {
      title: "The problem DI solves",
      body: "When a class creates its own dependencies with <code>new</code> inside its methods, it is tightly coupled to that specific implementation. You cannot swap it, test it in isolation, or change it without modifying the class itself.",
      link: "https://phptherightway.com/#dependency_injection",
    },
    {
      title: "Constructor injection",
      body: "Pass dependencies into the class via the constructor. The class receives what it needs; it does not go looking for it. This is the most common and recommended form of DI — the class is always in a valid, fully configured state from the moment it is instantiated.",
      link: "https://designpatternsphp.readthedocs.io/en/latest/Structural/DependencyInjection/README.html",
    },
    {
      title: "Type-hinting against interfaces",
      body: "Inject the interface, not the concrete class. <code>function __construct(LoggerInterface $logger)</code> accepts any class that implements <code>LoggerInterface</code>. This is what makes implementations swappable without changing the class that uses them.",
      link: "https://www.php.net/manual/en/language.oop5.php",
    },
    {
      title: "The service locator anti-pattern",
      body: "A class that calls a global registry to fetch its own dependencies (<code>Registry::get('logger')</code>) hides its dependencies. Nothing outside the class knows what it needs, and tests cannot replace the dependencies. This is the opposite of DI.",
      link: null,
    },
    {
      title: "Testability — the primary practical benefit",
      body: "With DI, in a test you can pass a fake (mock) implementation that does nothing or returns controlled values. The class under test never knows the difference. Without DI, the class creates its own dependencies and you cannot intercept them.",
      link: null,
    },
  ],
  activity: {
    type: "combined",
    title: "Implement DI from scratch",
    intro: "Build a small system using constructor injection and interfaces — no frameworks, pure PHP.",
    questions: [
      {
        q: "A ReportGenerator class creates a new PdfExporter() inside its generate() method. A new requirement arrives: some reports must export as CSV. What is the cleanest fix?",
        options: [
          "Add an if/else inside generate() to create either PdfExporter or CsvExporter based on a flag",
          "Create two separate classes: PdfReportGenerator and CsvReportGenerator",
          "Define an ExporterInterface with an export() method. Inject it via the constructor. Pass PdfExporter or CsvExporter from outside. ReportGenerator never changes.",
          "Add a setExporter() method and call it before generate()",
        ],
        answer: 2,
        explanation: "This is the Open/Closed principle in action: open for extension (new exporters), closed for modification (the generator never changes). The interface is the contract; the injected concrete class is the swappable implementation.",
      },
      {
        q: "What is the key difference between creating a dependency inside the constructor vs accepting it as a constructor parameter?",
        options: [
          "No practical difference — both store a logger",
          "Creating it inside is tightly coupled — you cannot swap the implementation without modifying the class. Accepting it as a parameter accepts any implementation, making it testable and flexible.",
          "Accepting as a parameter will throw an error if nothing is passed",
          "Creating it inside is better because it has no external dependencies",
        ],
        answer: 1,
        explanation: "When a class creates its own dependency, tests cannot inject a fake. If you want to switch implementations, you must edit the class. Accepting it as a parameter delegates that decision to the caller.",
      },
      {
        q: "You are writing a unit test for a PaymentProcessor class. It depends on a BankApiInterface. You do not want the test to make real API calls. What do you do?",
        options: [
          "Skip testing PaymentProcessor — it cannot be tested without the real API",
          "Create a FakeBankApi class that implements BankApiInterface and returns hardcoded values. Inject it into PaymentProcessor in the test.",
          "Mock the HTTP request at the network level",
          "Set a flag on BankApiInterface to enable test mode",
        ],
        answer: 1,
        explanation: "Because PaymentProcessor depends on the interface (not the concrete class), you can pass any implementation — including a fake one that returns whatever the test needs. This is the fundamental reason DI and interfaces are used together.",
      },
      {
        q: "A class has 7 constructor parameters. What does this most likely indicate?",
        options: [
          "The class is well-designed — it has many responsibilities",
          "The class has too many responsibilities and should be split into smaller, focused classes",
          "PHP has a limit of 8 constructor parameters",
          "Constructor injection should be replaced with property injection when there are this many dependencies",
        ],
        answer: 1,
        explanation: "Many constructor parameters is a code smell called 'constructor over-injection.' It signals that the class is doing too much. Split it into smaller classes, each with fewer, more focused dependencies.",
      },
      {
        q: "What is a 'service locator' and why is it considered an anti-pattern compared to constructor injection?",
        options: [
          "A service locator is a design pattern that improves performance",
          "A service locator is a global registry that classes query to fetch their own dependencies. It hides what a class needs (its dependencies are invisible from outside), making the code harder to test and understand. Constructor injection makes dependencies explicit and visible.",
          "A service locator is the same as a factory pattern",
          "Service locators are only bad in large applications",
        ],
        answer: 1,
        explanation: "The key word is 'hidden.' With a service locator, you cannot tell from a class's signature what it depends on. With constructor injection, the type hints on the constructor document every dependency clearly.",
      },
    ],
    steps: [
      {
        n: 1,
        title: "Create a Logger interface and two implementations",
        body: "Create src/Logger/LoggerInterface.php with log() and getLogs() methods. Then create ArrayLogger (stores logs in memory) and NullLogger (discards all logs — for testing).",
        code: `<?php
// src/Logger/LoggerInterface.php
declare(strict_types=1);
namespace Practice\\Logger;

interface LoggerInterface {
  public function log(string $level, string $message): void;
  public function getLogs(): array;
}

// src/Logger/ArrayLogger.php
class ArrayLogger implements LoggerInterface {
  private array $logs = [];
  public function log(string $level, string $message): void {
    $this->logs[] = sprintf('[%s] %s: %s', date('H:i:s'), strtoupper($level), $message);
  }
  public function getLogs(): array { return $this->logs; }
}

// src/Logger/NullLogger.php
class NullLogger implements LoggerInterface {
  public function log(string $level, string $message): void {}
  public function getLogs(): array { return []; }
}`,
      },
      {
        n: 2,
        title: "Create a Mailer interface and two implementations",
        body: "Create MailerInterface with a send() method. Implement LogMailer (logs instead of sending — for dev) and NullMailer (does nothing — for testing).",
        code: `<?php
// src/Mailer/MailerInterface.php
interface MailerInterface {
  public function send(string $to, string $subject, string $body): bool;
}

// src/Mailer/LogMailer.php — logs the email instead of sending
class LogMailer implements MailerInterface {
  public function __construct(private LoggerInterface $logger) {}
  public function send(string $to, string $subject, string $body): bool {
    $this->logger->log('info', "Email to {$to}: {$subject}");
    return true;
  }
}

// src/Mailer/NullMailer.php — silent no-op for tests
class NullMailer implements MailerInterface {
  public function send(string $to, string $subject, string $body): bool {
    return true;
  }
}`,
      },
      {
        n: 3,
        title: "Create an OrderService that uses both dependencies",
        body: "OrderService receives LoggerInterface and MailerInterface via constructor. It never uses new inside. Notice: no new keywords inside the class body.",
        code: `<?php
// src/Service/OrderService.php
namespace Practice\\Service;

use Practice\\Logger\\LoggerInterface;
use Practice\\Mailer\\MailerInterface;

class OrderService {
  public function __construct(
    private LoggerInterface $logger,
    private MailerInterface $mailer
  ) {}

  public function placeOrder(string $product, float $price, string $customerEmail): array {
    $orderId = uniqid('ORD-', true);
    $this->logger->log('info', "Order {$orderId} placed for {$product}, price: {$price}");
    $sent = $this->mailer->send($customerEmail, "Order Confirmed: {$product}",
      "Your order {$orderId} has been confirmed.");
    if (!$sent) {
      $this->logger->log('warning', "Confirmation email failed for order {$orderId}");
    }
    return ['order_id' => $orderId, 'product' => $product, 'price' => $price, 'email_sent' => $sent];
  }
}`,
      },
      {
        n: 4,
        title: "Wire everything together in test.php",
        body: "Create two setups: development (real logger + log mailer) and test (null logger + null mailer). Both use the same OrderService — it never knows which implementation it received.",
        code: `<?php
require_once __DIR__ . '/vendor/autoload.php';

use Practice\\Logger\\ArrayLogger;
use Practice\\Logger\\NullLogger;
use Practice\\Mailer\\LogMailer;
use Practice\\Mailer\\NullMailer;
use Practice\\Service\\OrderService;

echo "=== Test 1: Development setup ===\\n";
$logger  = new ArrayLogger();
$mailer  = new LogMailer($logger);
$service = new OrderService($logger, $mailer);
$order   = $service->placeOrder('MacBook Air', 1299.00, 'rj@example.com');
echo "Order ID: " . $order['order_id'] . "\\n";
foreach ($logger->getLogs() as $entry) { echo "  " . $entry . "\\n"; }

echo "\\n=== Test 2: Testing setup (null implementations) ===\\n";
$testService = new OrderService(new NullLogger(), new NullMailer());
$testOrder   = $testService->placeOrder('PHP Book', 49.00, 'test@test.com');
echo "Order placed: " . $testOrder['order_id'] . "\\n";
echo "Logger entries: 0 (expected: 0)\\n";`,
      },
      {
        n: 5,
        title: "Run and verify",
        body: "Test 1 should show logs. Test 2 should show the order ID but zero log entries — proving NullLogger and NullMailer were used without OrderService knowing.",
        code: `php test.php`,
      },
    ],
    aiCheck: {
      prompt: "Paste your OrderService.php and the output of php test.php. Confirm: does OrderService use new anywhere inside it? Does the test setup produce zero log entries? Could you add a third mailer implementation (e.g., SmtpMailer) without touching OrderService at all?",
      checkGoal: "Verify OrderService has zero new keywords inside it — all dependencies arrive via constructor. Check that both LoggerInterface and MailerInterface are type-hinted (not concrete classes). Verify NullLogger::getLogs() returns an empty array in Test 2. Award PASS if DI pattern is correct and both swap-outs work without modifying OrderService.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Day 9 — PHP Arrays & Functional Operations
// ─────────────────────────────────────────────────────────────────────────────
const DAY9: NewDay = {
  day: "Day 9",
  title: "PHP Arrays & Functional Operations",
  goal: "Be fast with PHP array manipulation — arrays are the most used data structure in PHP and you will work with them constantly.",
  reading: [
    {
      title: "array_map(), array_filter(), array_reduce()",
      body: "<code>array_map()</code> transforms every element and returns a new array. <code>array_filter()</code> removes elements for which the callback returns false (without a callback, removes all falsy values). <code>array_reduce()</code> collapses the array to a single value. Rule of thumb: map → same count, transformed values; filter → fewer elements, same values; reduce → single result.",
      link: "https://www.php.net/manual/en/ref.array.php",
    },
    {
      title: "array_filter() preserves keys",
      body: "Without a callback, <code>array_filter([0, 1, '', 'hello', null])</code> returns <code>[1 => 1, 3 => 'hello']</code> — original keys are preserved, falsy values removed. Use <code>array_values()</code> on the result to re-index. This surprises developers who expect sequential keys.",
      link: "https://www.php.net/manual/en/function.array-filter.php",
    },
    {
      title: "array_merge() vs + operator",
      body: "<code>array_merge()</code> reindexes numeric keys and the RIGHT array wins on string key conflicts. The <code>+</code> operator keeps the LEFT array's values for duplicate string keys. <code>$options += ['limit' => 10, 'offset' => 0]</code> is a common pattern for defaults — user values win because they are on the left.",
      link: "https://www.php.net/manual/en/function.array-map.php",
    },
    {
      title: "array_column() and usort()",
      body: "<code>array_column($records, 'name')</code> extracts one field from an array of records. <code>array_column($records, 'name', 'id')</code> creates a lookup map keyed by id. <code>usort()</code> sorts by a custom comparator using the spaceship operator <code><=></code>.",
      link: "https://www.php.net/manual/en/function.array-reduce.php",
    },
    {
      title: "Spread operator and array_walk()",
      body: "The spread operator <code>...$array</code> unpacks an array into individual arguments. <code>array_merge(...$arrays)</code> merges a variable number of arrays. <code>array_walk()</code> modifies an array in place by reference — unlike <code>array_map()</code> which returns a new array.",
      link: null,
    },
  ],
  activity: {
    type: "combined",
    title: "Array transformation pipeline",
    intro: "Build a data processing pipeline using only PHP array functions — no loops except where unavoidable.",
    questions: [
      {
        q: "You have an array of user records. Each record has keys id, name, active. You want an array of only the names of active users. Which is the correct single-expression approach?",
        options: [
          "array_map(fn($u) => $u['name'], $users)",
          "array_filter($users, fn($u) => $u['active'])",
          "array_map(fn($u) => $u['name'], array_filter($users, fn($u) => $u['active']))",
          "array_column($users, 'name')",
        ],
        answer: 2,
        explanation: "Filter first (get active users), then map (extract names). Option D would give ALL names including inactive users. Option B gives full records, not just names.",
      },
      {
        q: "What does array_filter([0, 1, 2, false, '', null, 'hello']) return without any callback?",
        options: [
          "The array unchanged",
          "[1 => 1, 2 => 2, 6 => 'hello'] — only truthy values, original keys preserved",
          "[1, 2, 'hello'] — only truthy values, re-indexed",
          "An error — array_filter() requires a callback",
        ],
        answer: 1,
        explanation: "Without a callback, array_filter() removes falsy values (0, false, '', null). It preserves original keys. Use array_values() on the result if you need sequential numeric keys.",
      },
      {
        q: "You have $a = ['x' => 1, 'y' => 2] and $b = ['y' => 99, 'z' => 3]. What is the result of $a + $b?",
        options: [
          "['x' => 1, 'y' => 99, 'z' => 3] — $b wins for 'y'",
          "['x' => 1, 'y' => 2, 'z' => 3] — $a wins for 'y'",
          "['x' => 1, 'y' => 101, 'z' => 3] — values are summed",
          "['x' => 1, 'y' => 2, 'y' => 99, 'z' => 3] — both kept",
        ],
        answer: 1,
        explanation: "The + operator keeps the LEFT array's value for duplicate keys. $a has 'y' => 2 so that wins. 'z' only exists in $b so it is added. This is useful for defaults: $options += ['limit' => 10, 'offset' => 0].",
      },
      {
        q: "You have an array of product arrays. Each has a category key. You want to group products by category. Which built-in function helps?",
        options: [
          "array_group_by() — built into PHP",
          "No built-in exists — use array_reduce() to build the grouped array manually",
          "array_column($products, null, 'category')",
          "usort() then array_chunk()",
        ],
        answer: 1,
        explanation: "PHP has no array_group_by(). Use array_reduce() with an accumulator array: if the category key doesn't exist in the carry, create it; then append the product. array_column() with three args creates a lookup by key but doesn't group multiple items under the same key.",
      },
      {
        q: "What is the difference between array_map() and array_walk()?",
        options: [
          "array_map() returns a new array; array_walk() modifies the array in place by passing elements by reference",
          "They are identical",
          "array_walk() returns a new array; array_map() modifies in place",
          "array_walk() only works on associative arrays",
        ],
        answer: 0,
        explanation: "array_map() is a pure function — takes an array, returns a new array, original unchanged. array_walk() passes each element by reference so modifications affect the original array. Also: array_walk() passes the key as a second argument to the callback.",
      },
    ],
    steps: [
      {
        n: 1,
        title: "Create the product dataset",
        body: "Add this array to test.php. It contains 6 products with id, name, price, category, in_stock, and tags fields.",
        code: `$products = [
  ['id' => 1, 'name' => 'MacBook Air',  'price' => 1299.00, 'category' => 'laptops', 'in_stock' => true,  'tags' => ['apple', 'laptop']],
  ['id' => 2, 'name' => 'Dell XPS 15',  'price' => 1499.00, 'category' => 'laptops', 'in_stock' => false, 'tags' => ['dell', 'laptop']],
  ['id' => 3, 'name' => 'Sony WH-1000', 'price' => 349.00,  'category' => 'audio',   'in_stock' => true,  'tags' => ['sony', 'headphones']],
  ['id' => 4, 'name' => 'iPad Pro',     'price' => 999.00,  'category' => 'tablets', 'in_stock' => true,  'tags' => ['apple', 'tablet']],
  ['id' => 5, 'name' => 'Kindle Paper', 'price' => 139.00,  'category' => 'tablets', 'in_stock' => true,  'tags' => ['amazon', 'ereader']],
  ['id' => 6, 'name' => 'AirPods Pro',  'price' => 249.00,  'category' => 'audio',   'in_stock' => false, 'tags' => ['apple', 'earphones']],
];`,
      },
      {
        n: 2,
        title: "Implement all 8 transformations",
        body: "Write each transformation using the appropriate array function. No foreach loops where an array function is available.",
        code: `// 1. Filter: only in-stock products
$inStock = array_filter($products, fn($p) => $p['in_stock']);
echo "In stock: " . count($inStock) . "\\n"; // expected: 4

// 2. Map: names of in-stock products
$inStockNames = array_map(fn($p) => $p['name'], $inStock);
echo "Names: " . implode(', ', $inStockNames) . "\\n";

// 3. Sort by price ascending
$sorted = $products;
usort($sorted, fn($a, $b) => $a['price'] <=> $b['price']);
echo "Cheapest: " . $sorted[0]['name'] . "\\n";

// 4. Reduce: total value of in-stock products
$totalValue = array_reduce(
  array_filter($products, fn($p) => $p['in_stock']),
  fn($carry, $p) => $carry + $p['price'],
  0.0
);
echo "Total in-stock value: $" . number_format($totalValue, 2) . "\\n";

// 5. All unique tags across all products
$allTags    = array_merge(...array_column($products, 'tags'));
$uniqueTags = array_values(array_unique($allTags));
sort($uniqueTags);
echo "Tags: " . implode(', ', $uniqueTags) . "\\n";

// 6. Group by category using array_reduce
$byCategory = array_reduce($products, function (array $carry, array $product): array {
  $carry[$product['category']][] = $product['name'];
  return $carry;
}, []);
foreach ($byCategory as $cat => $names) { echo "  {$cat}: " . implode(', ', $names) . "\\n"; }

// 7. Lookup map: id => name
$lookup = array_column($products, 'name', 'id');
echo "Product ID 3: " . $lookup[3] . "\\n"; // Sony WH-1000

// 8. Defaults pattern using + operator
$defaults = ['limit' => 10, 'offset' => 0, 'sort' => 'name', 'order' => 'asc'];
$opts = ['limit' => 5, 'sort' => 'price'] + $defaults;
echo "limit={$opts['limit']}, sort={$opts['sort']}, order={$opts['order']}\\n";`,
      },
      {
        n: 3,
        title: "Run and verify",
        body: "Run php test.php and check all 8 outputs match expected values: 4 in-stock products, cheapest is Kindle Paper, total $2786.00.",
        code: `php test.php`,
      },
    ],
    aiCheck: {
      prompt: "Paste your complete transformation code and the output. Do all 8 results match expected output? For the + operator test — what is $opts['order']? Why does it equal 'asc' even though the user did not pass it?",
      checkGoal: "Verify all 8 transformations use the correct array function (not foreach loops where an array function was available). Check that array_reduce is used for the total value and grouping. Check that array_column is used for the lookup map. Verify the + operator explanation — user options win, defaults fill in the rest.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Day 10 — PHP Strings & Regular Expressions
// ─────────────────────────────────────────────────────────────────────────────
const DAY10: NewDay = {
  day: "Day 10",
  title: "PHP Strings & Regular Expressions",
  goal: "Handle strings confidently — formatting, searching, replacing, validating, and processing text without relying on manual character loops.",
  reading: [
    {
      title: "Essential string functions",
      body: "<code>str_contains()</code>, <code>str_starts_with()</code>, <code>str_ends_with()</code> — PHP 8+ clean alternatives to strpos. <code>substr()</code> extracts a portion. <code>str_replace()</code> finds and replaces. <code>trim()</code> strips whitespace. <code>strlen()</code> vs <code>mb_strlen()</code> — byte count vs character count. Always use <code>mb_</code> functions for user-entered text that may contain non-ASCII characters.",
      link: "https://www.php.net/manual/en/ref.strings.php",
    },
    {
      title: "sprintf() for formatted output",
      body: "Safer and more readable than concatenation for complex strings: <code>sprintf('User %s has %d items worth $%.2f', $name, $count, $total)</code>. Use <code>%s</code> for strings, <code>%d</code> for integers, <code>%.2f</code> for floats with 2 decimal places.",
      link: "https://www.php.net/manual/en/function.sprintf.php",
    },
    {
      title: "Regular expressions — the three functions you need",
      body: "<code>preg_match(pattern, subject, &$matches)</code> — test if pattern matches, capture groups go into <code>$matches</code>. <code>preg_replace(pattern, replacement, subject)</code> — find and replace. <code>preg_split(pattern, subject)</code> — split by a regex delimiter.",
      link: "https://www.php.net/manual/en/book.pcre.php",
    },
    {
      title: "Regex syntax essentials",
      body: "<code>^</code> and <code>$</code> anchor to start/end of string. <code>[a-z0-9]</code> is a character class. <code>+</code> one or more, <code>*</code> zero or more, <code>?</code> zero or one. <code>{3}</code> exactly 3 times. <code>()</code> capture group. <code>\\d</code> digit, <code>\\w</code> word char, <code>\\s</code> whitespace. <code>/i</code> flag for case-insensitive.",
      link: "https://regexr.com",
    },
    {
      title: "htmlspecialchars() vs strip_tags()",
      body: "<code>htmlspecialchars($input, ENT_QUOTES, 'UTF-8')</code> converts <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, <code>&quot;</code> to HTML entities so they render as text and cannot be script. This is the correct way to output user input in HTML. <code>strip_tags()</code> removes tags entirely but what remains could still contain event attributes.",
      link: null,
    },
  ],
  activity: {
    type: "combined",
    title: "String processing utility class",
    intro: "Build a StringHelper class with five utility functions and test them thoroughly.",
    questions: [
      {
        q: "A user enters 'Héllo Wörld' as their username. You call strlen($username). What does it return and why might this be wrong?",
        options: [
          "11 — correct, it counts characters",
          "More than 11 — strlen() counts bytes not characters. Accented characters like é and ö take 2 bytes in UTF-8. Use mb_strlen() for character count.",
          "11 — strlen() handles Unicode correctly in PHP 8",
          "An error — strlen() only accepts ASCII strings",
        ],
        answer: 1,
        explanation: "strlen() is byte-aware, not character-aware. é is 2 bytes in UTF-8 so strlen('Héllo') returns 6, not 5. Always use mb_strlen(), mb_substr(), mb_strtolower() etc. when working with user input that may contain non-ASCII characters.",
      },
      {
        q: "You need to validate that a string is a valid slug (lowercase letters, numbers, hyphens only, starts and ends with a letter or number). Which regex is correct?",
        options: [
          "/[a-z0-9-]+/",
          "/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/",
          "/^[a-z-]+$/",
          "/slug/",
        ],
        answer: 1,
        explanation: "The anchors ^ and $ ensure the full string matches. The first alternative handles slugs with multiple characters (must start and end with alphanumeric). The second alternative handles single-character slugs. Option A has no anchors so 'hello!' would match. Option C disallows numbers.",
      },
      {
        q: "What does preg_replace('/\\s+/', '-', 'hello   world  php') return?",
        options: [
          "'hello---world--php' — replaces each space with a hyphen",
          "'hello-world-php' — replaces runs of whitespace with one hyphen",
          "'hello world php' — unchanged",
          "An array of matches",
        ],
        answer: 1,
        explanation: "\\s+ matches one OR MORE consecutive whitespace characters. The + quantifier is greedy so '   ' (three spaces) is treated as a single match and replaced with one hyphen.",
      },
      {
        q: "You call preg_match('/(\\d{4})-(\\d{2})-(\\d{2})/', '2026-05-01', $matches). What does $matches contain?",
        options: [
          "['2026-05-01'] — only the full match",
          "['2026-05-01', '2026', '05', '01'] — full match plus each capture group",
          "['2026', '05', '01'] — only the capture groups",
          "true — preg_match only returns a boolean",
        ],
        answer: 1,
        explanation: "$matches[0] is always the full match. $matches[1], $matches[2], $matches[3] are the capture groups in order of their opening parenthesis. preg_match() returns 1 if matched, 0 if not, false on error.",
      },
      {
        q: "Which is safer for building an HTML string that includes user input?",
        options: [
          "'<p>' . $userInput . '</p>'",
          "'<p>' . htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8') . '</p>'",
          "strip_tags($userInput)",
          "addslashes($userInput)",
        ],
        answer: 1,
        explanation: "htmlspecialchars() converts dangerous characters (<, >, &, \", ') to HTML entities so they render as text and cannot be interpreted as markup or script. Option A is a raw XSS vulnerability. Option C removes tags but what remains could still contain event attributes. addslashes() is for escaping string delimiters, not HTML.",
      },
    ],
    steps: [
      {
        n: 1,
        title: "Create src/Utility/StringHelper.php with five methods",
        body: "Implement slugify(), truncate(), extractEmails(), maskCardNumber(), and formatBytes(). Key details: slugify() must use mb_strtolower and iconv for Unicode. truncate() must strip HTML before measuring length and cut at word boundaries.",
        code: `<?php
declare(strict_types=1);
namespace Practice\\Utility;

class StringHelper {

  public static function slugify(string $input): string {
    $result = mb_strtolower($input, 'UTF-8');
    $result = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $result);
    $result = preg_replace('/[^a-z0-9]+/', '-', $result);
    return trim($result, '-');
  }

  public static function truncate(string $text, int $maxLength, string $suffix = '...'): string {
    $plain = strip_tags($text);
    if (mb_strlen($plain) <= $maxLength) return $plain;
    $truncated  = mb_substr($plain, 0, $maxLength);
    $lastSpace  = mb_strrpos($truncated, ' ');
    if ($lastSpace !== false) $truncated = mb_substr($truncated, 0, $lastSpace);
    return $truncated . $suffix;
  }

  public static function extractEmails(string $text): array {
    preg_match_all('/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/', $text, $matches);
    return array_unique($matches[0]);
  }

  public static function maskCardNumber(string $number): string {
    $digits = preg_replace('/\\D/', '', $number);
    if (strlen($digits) < 4) return str_repeat('*', strlen($digits));
    $last4  = substr($digits, -4);
    $masked = str_repeat('*', strlen($digits) - 4) . $last4;
    return implode(' ', str_split($masked, 4));
  }

  public static function formatBytes(int $bytes): string {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $index = 0;
    $value = (float) $bytes;
    while ($value >= 1024 && $index < count($units) - 1) { $value /= 1024; $index++; }
    return $index === 0 ? sprintf('%d %s', (int) $value, $units[$index])
                        : sprintf('%.2f %s', $value, $units[$index]);
  }
}`,
      },
      {
        n: 2,
        title: "Test all five functions",
        body: "Run through multiple test cases for each function. All slugify tests should show ✓. extractEmails should find exactly 2 emails. maskCardNumber should handle spaces in input.",
        code: `<?php
require_once __DIR__ . '/vendor/autoload.php';
use Practice\\Utility\\StringHelper;

echo "=== slugify() ===\\n";
$cases = [
  'Hello World!'         => 'hello-world',
  'My Module Name!!!'    => 'my-module-name',
  '  Spaces   Around  '  => 'spaces-around',
  'café au lait'         => 'cafe-au-lait',
  '---already-slugged---'=> 'already-slugged',
];
foreach ($cases as $input => $expected) {
  $result = StringHelper::slugify($input);
  echo ($result === $expected ? '✓' : '✗') . " '{$input}' -> '{$result}'\\n";
}

echo "\\n=== extractEmails() ===\\n";
$text   = 'Contact support@example.com or sales@company.org. Ignore @bad and notanemail';
$emails = StringHelper::extractEmails($text);
echo "Found: " . implode(', ', $emails) . " (expected: 2)\\n";

echo "\\n=== maskCardNumber() ===\\n";
echo StringHelper::maskCardNumber('4111111111111111') . "\\n"; // **** **** **** 1111
echo StringHelper::maskCardNumber('4111 1111 1111 1111') . "\\n"; // same

echo "\\n=== formatBytes() ===\\n";
echo StringHelper::formatBytes(500)      . "\\n"; // 500 B
echo StringHelper::formatBytes(1024)     . "\\n"; // 1.00 KB
echo StringHelper::formatBytes(1048576)  . "\\n"; // 1.00 MB`,
      },
      {
        n: 3,
        title: "Run and verify",
        body: "Run php test.php and confirm all slugify tests pass, extractEmails finds exactly 2 emails, and maskCardNumber produces the expected masked output.",
        code: `php test.php`,
      },
    ],
    aiCheck: {
      prompt: "Paste StringHelper.php and the full test output. Do all slugify tests show ✓? Does extractEmails() return exactly 2 emails? Does maskCardNumber('4111 1111 1111 1111') produce '**** **** **** 1111'?",
      checkGoal: "Verify slugify() uses mb_strtolower and iconv for Unicode handling, not just strtolower. Check that truncate() strips HTML before measuring length and cuts at word boundary. Check that extractEmails() uses preg_match_all and returns deduplicated results. Check formatBytes() uses a loop and sprintf() for decimal formatting. Award PASS if all five functions produce correct output on the edge cases.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Day 11 — PHP 8 Modern Syntax
// ─────────────────────────────────────────────────────────────────────────────
const DAY11: NewDay = {
  day: "Day 11",
  title: "PHP 8 Modern Syntax",
  goal: "Read and write modern PHP 8.x code fluently — the syntax used throughout any current PHP codebase.",
  reading: [
    {
      title: "Null coalescing ?? and nullsafe ?->",
      body: "<code>$name = $user['name'] ?? 'Anonymous'</code> — returns the left operand if not null, otherwise the right. Chains: <code>$a ?? $b ?? $c</code>. The nullsafe operator <code>?-></code> short-circuits a method chain if any object is null: <code>$city = $user?->getAddress()?->getCity()</code> returns null instead of throwing if user or address is null.",
      link: "https://www.php.net/releases/8.0/en.php",
    },
    {
      title: "Match expression",
      body: "A type-safe <code>switch</code> that: uses strict comparison (<code>===</code> not <code>==</code>), returns a value, throws <code>UnhandledMatchError</code> if no arm matches (no silent fall-through), and requires no <code>break</code> statements. Example: <code>$label = match($status) { 'active' => 'Active user', default => 'Unknown' };</code>",
      link: "https://stitcher.io/blog/new-in-php-8",
    },
    {
      title: "Constructor property promotion",
      body: "Declare and assign constructor parameters as properties in one step. The visibility keyword (<code>public</code>, <code>protected</code>, <code>private</code>) on the parameter triggers promotion: <code>public function __construct(private string $name, private readonly string $email) {}</code> — no body needed. PHP handles the assignment.",
      link: "https://www.php.net/releases/8.1/en.php",
    },
    {
      title: "readonly properties",
      body: "<code>readonly</code> properties can be set exactly once, during construction. Any subsequent write throws an <code>Error</code>. Works well with DI: inject whatever value the test needs at construction time, and the property can never be accidentally overwritten afterward.",
      link: "https://stitcher.io/blog/new-in-php-81",
    },
    {
      title: "Enums (PHP 8.1)",
      body: "A type-safe alternative to class constants or string/int magic values. Backed enums have an underlying type: <code>enum Status: string { case Active = 'active'; case Draft = 'draft'; }</code>. Access the value: <code>Status::Active->value</code> returns <code>'active'</code>. A function accepting <code>Status</code> rejects plain strings — use <code>Status::from('active')</code> to create from a string.",
      link: null,
    },
  ],
  activity: {
    type: "combined",
    title: "Modernize existing code with PHP 8 syntax",
    intro: "Rewrite Node.php using constructor property promotion, add a Status enum with a match expression, and add an Article with the nullsafe operator.",
    questions: [
      {
        q: "What does $result = $config['timeout'] ?? $settings['timeout'] ?? 30 evaluate to if $config['timeout'] is null and $settings does not have a 'timeout' key?",
        options: [
          "null",
          "30 — the null coalescing operator chains: if the first is null or unset, try the second; if that is also null or unset, use 30",
          "An error — $settings['timeout'] is undefined",
          "0",
        ],
        answer: 1,
        explanation: "?? can chain. If the left side is null or undefined, PHP moves to the right side. No undefined index warning is thrown because ?? specifically suppresses that. This is a common pattern for cascading configuration defaults.",
      },
      {
        q: "A switch statement checks $code == 0. A match expression checks $code === 0. You pass the string '0'. What is the difference in behavior?",
        options: [
          "No difference — both comparisons are equivalent",
          "switch matches (loose comparison == coerces '0' to 0). match does NOT match (strict comparison === requires same type and value). match will throw UnhandledMatchError if no default.",
          "Both throw an error when given a string",
          "match matches but switch does not",
        ],
        answer: 1,
        explanation: "This is a real source of bugs in code migrated from switch to match. Always provide a default arm in match unless you are certain all possible values are covered.",
      },
      {
        q: "Which of these correctly uses constructor property promotion?",
        options: [
          "class Product { public function __construct(string $name) { $this->name = $name; } }",
          "class Product { public function __construct(private string $name) {} }",
          "Options A and B are equivalent; B uses constructor property promotion",
          "class Product { private string $name; public function __construct(private string $name) { $this->name = $name; } }",
        ],
        answer: 2,
        explanation: "Options A and B are functionally equivalent. Option A is the traditional approach. Option B uses constructor property promotion — the private keyword triggers automatic property declaration and assignment. Option D uses promotion syntax but then also manually assigns — the manual assignments are redundant.",
      },
      {
        q: "You define enum Color: string { case Red = 'red'; case Blue = 'blue'; }. A function accepts a Color parameter. What happens if you pass the string 'red' directly?",
        options: [
          "PHP automatically converts 'red' to Color::Red",
          "A TypeError is thrown — enums must be passed as enum instances, not raw values. Use Color::from('red') to create an instance from a string.",
          "The function receives null",
          "It works because Color is backed by string",
        ],
        answer: 1,
        explanation: "Enums are types. A Color parameter requires a Color instance. To create one from a string, use Color::from('red') (throws ValueError if invalid) or Color::tryFrom('red') (returns null if invalid). This prevents invalid values from being passed.",
      },
      {
        q: "You have a class with a readonly property. A unit test tries to set the property to a different value for testing purposes. What happens?",
        options: [
          "The value is updated silently",
          "An Error is thrown — readonly properties cannot be modified after construction even in tests. Design the class to accept the test value through the constructor instead.",
          "A deprecation warning is shown",
          "readonly can be bypassed using reflection in tests",
        ],
        answer: 1,
        explanation: "readonly is a hard language constraint. The correct solution is to pass the test value via the constructor — which is why DI and constructor injection pair well with readonly.",
      },
    ],
    steps: [
      {
        n: 1,
        title: "Rewrite Node.php with modern PHP 8 syntax",
        body: "Apply constructor property promotion to all four properties. Add a getStatusLabel() method using match. Note the readonly trap: readonly with a default value of 0 means 0 IS the value — if you need time() as default, handle it conditionally in the constructor body.",
        code: `<?php
// src/Entity/Node.php
declare(strict_types=1);
namespace Practice\\Entity;

class Node implements ContentInterface {
  public function __construct(
    protected string $title,
    protected string $body,
    protected bool $status = true,
    protected int $createdAt = 0   // not readonly — we set it conditionally below
  ) {
    if ($this->createdAt === 0) {
      $this->createdAt = time();
    }
  }

  public function getTitle(): string  { return $this->title; }
  public function getBody(): string   { return $this->body; }
  public function isPublished(): bool { return $this->status; }

  public function getStatusLabel(): string {
    return match($this->status) {
      true  => 'Published',
      false => 'Draft',
    };
  }

  public function toArray(): array {
    return ['title' => $this->title, 'body' => $this->body,
            'status' => $this->status, 'createdAt' => $this->createdAt];
  }
}`,
      },
      {
        n: 2,
        title: "Add a Status enum",
        body: "Create src/Entity/Status.php as a backed string enum with label() and isVisible() methods using match.",
        code: `<?php
// src/Entity/Status.php
declare(strict_types=1);
namespace Practice\\Entity;

enum Status: string {
  case Published = 'published';
  case Draft     = 'draft';
  case Archived  = 'archived';

  public function label(): string {
    return match($this) {
      Status::Published => 'Published',
      Status::Draft     => 'Draft',
      Status::Archived  => 'Archived',
    };
  }

  public function isVisible(): bool {
    return $this === Status::Published;
  }
}`,
      },
      {
        n: 3,
        title: "Add nullsafe operator to Article",
        body: "Update Article.php to add a $relatedArticle property and a getRelatedTitle() method using the nullsafe operator.",
        code: `// Add to Article.php
private ?Article $relatedArticle = null;

public function setRelatedArticle(Article $article): void {
  $this->relatedArticle = $article;
}

// Returns null if no related article — no null check needed
public function getRelatedTitle(): ?string {
  return $this->relatedArticle?->getTitle();
}`,
      },
      {
        n: 4,
        title: "Test all new features",
        body: "Test the match expression, nullsafe operator, and readonly error. The readonly Error must be caught as \\Error not \\Exception.",
        code: `// Test match expression
$status = Status::Published;
echo $status->label() . "\\n";         // Published
echo ($status->isVisible() ? 'visible' : 'hidden') . "\\n"; // visible

// Test nullsafe operator
$article = new Article('Main Article', 'Body.', 'RJ');
echo ($article->getRelatedTitle() ?? 'No related article') . "\\n"; // No related article
$article->setRelatedArticle(new Article('Related', 'Body.', 'RJ'));
echo ($article->getRelatedTitle() ?? 'No related article') . "\\n"; // Related

// Test readonly throws Error (not Exception)
try {
  $point = new class(1.0, 2.0) {
    public function __construct(public readonly float $x, public readonly float $y) {}
  };
  $point->x = 3.0; // throws
} catch (\\Error $e) {
  echo "Caught: " . $e->getMessage() . "\\n";
}`,
      },
    ],
    aiCheck: {
      prompt: "Paste your updated Node.php, Status.php, and the test output. Does Status::Published->label() return 'Published'? Does getRelatedTitle() return null when no related article is set? Does modifying a readonly property throw an \\Error?",
      checkGoal: "Verify constructor property promotion is used in Node (visibility keyword on parameters). Check that Status is a backed enum with string type. Verify match is used in Status::label() with no break statements. Verify the nullsafe ?-> is used in getRelatedTitle(). Check that the readonly error is caught as \\Error not \\Exception.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Day 12 — Composer & Autoloading
// ─────────────────────────────────────────────────────────────────────────────
const DAY12: NewDay = {
  day: "Day 12",
  title: "Composer & Autoloading",
  goal: "Understand Composer well enough to manage any PHP project's dependencies — what it does, how the files work, and what happens when you run each command.",
  reading: [
    {
      title: "composer install vs composer update",
      body: "<code>composer install</code> reads <code>composer.lock</code> and installs exactly those versions. Use this on deployment and when cloning a repo. <code>composer update</code> recalculates from <code>composer.json</code> constraints and may install newer versions. It updates <code>composer.lock</code>. Use this only when you intentionally want newer packages.",
      link: "https://getcomposer.org/doc/",
    },
    {
      title: "composer.lock — commit it for apps, not for libraries",
      body: "Commit <code>composer.lock</code> for applications — it guarantees identical installs across all environments. For libraries, do not commit the lock file — it would force your users to use your exact transitive dependency versions, which may conflict with theirs.",
      link: "https://getcomposer.org/doc/articles/versions.md",
    },
    {
      title: "Version constraints",
      body: "<code>^1.2.3</code> — compatible with 1.2.3, allows up to (not including) 2.0.0. <code>~1.2.3</code> — allows patch updates only, up to (not including) 1.3.0. <code>1.2.3</code> — exact version. <code>>=1.2 &lt;2.0</code> — explicit range. <code>*</code> — any version (avoid).",
      link: null,
    },
    {
      title: "PSR-4 autoloading",
      body: "Maps a namespace prefix to a directory. <code>\"Practice\\\\\\\\\": \"src/\"</code> tells Composer that <code>Practice\\Entity\\Node</code> lives at <code>src/Entity/Node.php</code>. Run <code>composer dump-autoload</code> after adding new classes or changing the mapping to regenerate the loader.",
      link: "https://www.php-fig.org/psr/psr-4/",
    },
    {
      title: "require vs require-dev, and useful inspect commands",
      body: "<code>require</code> — production dependencies, always installed. <code>require-dev</code> — skipped with <code>--no-dev</code> on deployment. Useful commands: <code>composer show</code> lists installed packages. <code>composer outdated</code> shows what has newer versions. <code>composer why vendor/package</code> explains why a package is installed.",
      link: "https://packagist.org",
    },
  ],
  activity: {
    type: "combined",
    title: "Composer project setup",
    intro: "Add real dependencies to your practice project, write and run PHPUnit tests, and inspect what Composer resolved.",
    questions: [
      {
        q: "Your composer.json requires \"guzzlehttp/guzzle\": \"^7.4\". A teammate runs composer update and Guzzle 7.9 is now installed. Your other teammate runs composer install from the same repo. Which version do they get?",
        options: [
          "7.4 — the minimum specified in composer.json",
          "7.9 — the latest compatible version",
          "Exactly 7.9 — because composer.lock was updated to 7.9 when the first teammate ran composer update, and composer install reads the lock file",
          "The latest version of Guzzle regardless of constraints",
        ],
        answer: 2,
        explanation: "This is the entire purpose of composer.lock. After composer update, the lock file records the exact resolved version. Everyone who runs composer install after that gets the same exact version — not a recalculation from composer.json.",
      },
      {
        q: "You add a new class Practice\\Repository\\UserRepository in src/Repository/UserRepository.php. After running composer install again, the class still cannot be found. What is the most likely fix?",
        options: [
          "Add require_once 'src/Repository/UserRepository.php' manually",
          "Run composer dump-autoload to regenerate the autoloader files",
          "Move the class to the src/ root directory",
          "Add the class to composer.json under autoload.classmap",
        ],
        answer: 1,
        explanation: "PSR-4 autoloading is directory-based so new files in existing directories should be found automatically after dump-autoload. If the path matches the namespace, regenerating the autoloader is all that is needed.",
      },
      {
        q: "You are building an open source PHP library. You want phpunit for testing but users of your library should not have it installed in their projects. Where should phpunit go in composer.json?",
        options: [
          "require",
          "require-dev",
          "suggest",
          "conflict",
        ],
        answer: 1,
        explanation: "require-dev marks a package as a development dependency. When someone installs your library as a dependency in their project, Composer skips require-dev entries from your composer.json.",
      },
      {
        q: "What does ^ mean in \"symfony/http-foundation\": \"^6.3\"?",
        options: [
          "Must be exactly 6.3.0",
          "6.3.0 or higher, but less than 7.0.0 — the caret allows minor and patch updates within the same major version",
          "6.3.0 or higher with no upper limit",
          "6.x or 7.x — any version starting with 6 or 7",
        ],
        answer: 1,
        explanation: "The caret ^ operator means 'compatible with' and follows semantic versioning. ^6.3 = >=6.3.0 <7.0.0. It assumes that a major version bump may have breaking changes, so it stays within the major version.",
      },
      {
        q: "A colleague says 'never commit composer.lock to version control for libraries, but always commit it for applications.' Is this correct, and why?",
        options: [
          "No — always commit composer.lock for both",
          "Yes — for applications you want deterministic installs on every deployment. For libraries, committing the lock file would force your users to use your exact transitive dependency versions, which may conflict with theirs.",
          "No — never commit composer.lock",
          "It depends on the PHP version",
        ],
        answer: 1,
        explanation: "This is the widely-accepted Composer convention. Application lock files ensure identical production deployments. Library lock files cause dependency conflicts for library consumers. The Composer documentation recommends this distinction.",
      },
    ],
    steps: [
      {
        n: 1,
        title: "Inspect your practice project's composer.json",
        body: "Navigate to your PHP practice directory and check the current composer.json. It should show the PSR-4 autoloading from your earlier work.",
        code: `cd ~/php-practice
cat composer.json`,
      },
      {
        n: 2,
        title: "Add a production dependency — ramsey/uuid",
        body: "Install the UUID library — a common package for generating unique identifiers. Verify it appears under require (not require-dev) in composer.json.",
        code: `composer require ramsey/uuid
composer show ramsey/uuid`,
      },
      {
        n: 3,
        title: "Use the dependency",
        body: "Add UUID generation to test.php and verify that two generated UUIDs are always different.",
        code: `use Ramsey\\Uuid\\Uuid;

$uuid1 = Uuid::uuid4()->toString();
$uuid2 = Uuid::uuid4()->toString();
echo "UUID 1: {$uuid1}\\n";
echo "UUID 2: {$uuid2}\\n";
echo "Different: " . ($uuid1 !== $uuid2 ? 'yes' : 'no') . "\\n";`,
      },
      {
        n: 4,
        title: "Add a dev dependency — phpunit/phpunit",
        body: "Install PHPUnit as a development dependency. Verify it appears under require-dev in composer.json.",
        code: `composer require --dev phpunit/phpunit
grep -A 5 '"require-dev"' composer.json`,
      },
      {
        n: 5,
        title: "Write and run a StringHelper unit test",
        body: "Create tests/StringHelperTest.php with 7 test methods covering slugify, truncate, extractEmails, and formatBytes. Run the suite and confirm all 7 pass.",
        code: `<?php
// tests/StringHelperTest.php
use PHPUnit\\Framework\\TestCase;
use Practice\\Utility\\StringHelper;

class StringHelperTest extends TestCase {
  public function testSlugifyConvertsSpacesToHyphens(): void {
    $this->assertEquals('hello-world', StringHelper::slugify('Hello World'));
  }
  public function testSlugifyRemovesSpecialChars(): void {
    $this->assertEquals('my-module-name', StringHelper::slugify('My Module Name!!!'));
  }
  public function testSlugifyTrimsHyphens(): void {
    $this->assertEquals('already-slugged', StringHelper::slugify('---already-slugged---'));
  }
  public function testTruncateShortTextUnchanged(): void {
    $this->assertEquals('Hi', StringHelper::truncate('Hi', 100));
  }
  public function testTruncateAtWordBoundary(): void {
    $result = StringHelper::truncate('The quick brown fox', 10);
    $this->assertStringEndsWith('...', $result);
  }
  public function testExtractEmailsFindsAllEmails(): void {
    $emails = StringHelper::extractEmails('hello@example.com and sales@test.org');
    $this->assertCount(2, $emails);
  }
  public function testFormatBytesConvertsKilobytes(): void {
    $this->assertEquals('1.00 KB', StringHelper::formatBytes(1024));
  }
}

// Run:
// vendor/bin/phpunit tests/StringHelperTest.php`,
      },
      {
        n: 6,
        title: "Inspect transitive dependencies",
        body: "Check how many total packages were installed — it will be far more than the 2 packages you explicitly required, because your dependencies have their own dependencies.",
        code: `composer show | wc -l
composer why doctrine/instantiator 2>/dev/null || echo "Not installed"`,
      },
      {
        n: 7,
        title: "Run the full test suite",
        body: "Run PHPUnit and confirm all 7 tests pass. The output should show 7 dots and 'OK (7 tests, 7 assertions)'.",
        code: `vendor/bin/phpunit tests/StringHelperTest.php`,
      },
    ],
    aiCheck: {
      prompt: "Paste your composer.json and the PHPUnit test output. Are all 7 tests passing? Is phpunit/phpunit under require-dev and ramsey/uuid under require? Run composer show | wc -l and paste the count — how many total packages were installed?",
      checkGoal: "Verify require-dev contains phpunit and require contains ramsey/uuid (not swapped). Check all 7 PHPUnit assertions pass. Check that the student understands transitive dependencies — the package count from composer show will be much higher than the 2 packages they explicitly required.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Day 13 — Phase 0 Final Review
// ─────────────────────────────────────────────────────────────────────────────
const DAY13: NewDay = {
  day: "Day 13",
  title: "Phase 0 Final Review",
  goal: "Confirm that PHP fundamentals are solid and the student is ready to move into Drupal-specific content in Phase 1. No Drupal knowledge is expected or tested.",
  reading: [],
  activity: {
    type: "quiz",
    questions: [
      {
        q: "What is the difference between extends and implements in PHP? Can a class use both at the same time?",
        options: [
          "They are synonyms — both mean the same thing in PHP",
          "extends inherits from one class. implements fulfills an interface contract. A class can do both: class Foo extends Bar implements Baz, Qux",
          "extends is for abstract classes only. implements is for all other classes.",
          "A class can only use one of them — not both simultaneously",
        ],
        answer: 1,
        explanation: "extends gives you one parent class and its inherited members. implements requires you to provide all methods declared in the interface. You can extend one class and implement multiple interfaces at the same time.",
      },
      {
        q: "You have two classes — Invoice and ShippingLabel — that are completely unrelated but both need identical logic for generating a reference number. Inheritance is not appropriate. What is the correct PHP solution?",
        options: [
          "Copy and paste the logic into both classes",
          "Create a third class ReferenceGenerator and have both extend it",
          "Create a trait HasReferenceNumber containing the method and use it in both classes with 'use HasReferenceNumber'",
          "Define the logic as a standalone function in the global namespace",
        ],
        answer: 2,
        explanation: "Traits exist specifically for this case: shared implementation across unrelated classes that cannot share a parent. The trait is written once and mixed into any class that needs it.",
      },
      {
        q: "Which is the correct structure for a PHP interface called Storable with save(): bool and delete(): bool, and a class Draft that implements it?",
        options: [
          "interface Storable { function save(); function delete(); } class Draft { public function save() {} public function delete() {} }",
          "interface Storable { public function save(): bool; public function delete(): bool; } class Draft implements Storable { public function save(): bool { return true; } public function delete(): bool { return true; } }",
          "abstract class Storable { abstract function save(): bool; abstract function delete(): bool; } class Draft extends Storable {}",
          "interface Storable extends Draft {}",
        ],
        answer: 1,
        explanation: "Interfaces use the interface keyword and declare method signatures with return types. Classes use implements and must provide a method body for every declared method. Option A is missing return types and visibility. Option C is an abstract class, not an interface.",
      },
      {
        q: "A findByEmail(string $email): ?array method should return the first matching user or null. Which implementation(s) are correct?",
        options: [
          "foreach ($this->users as $u) { if ($u['email'] == $email) return $u; } return false;",
          "return array_filter($this->users, fn($u) => $u['email'] === $email)[0] ?? null;",
          "foreach ($this->users as $user) { if ($user['email'] === $email) { return $user; } } return null;",
          "Both B and C are correct — C uses a loop, B uses array functions. Both return the correct type. Note: B should use array_values()[0] to be safe.",
        ],
        answer: 3,
        explanation: "Both work. C is the most readable and explicit. B uses array_filter() but note: array_filter() preserves keys so [0] may not exist — it should use array_values()[0] ?? null to be safe. The return type must be ?array — not bool (Option A).",
      },
      {
        q: "What does declare(strict_types=1) do? What happens when you call add(int $a, int $b): int with add(1.5, 2) — with and without strict types?",
        options: [
          "It has no effect — PHP always coerces types automatically",
          "Without strict types: 1.5 is silently coerced to 1 (int), function receives 1 and 2, returns 3. With strict types: PHP throws a TypeError immediately — 1.5 is a float, not an int.",
          "With strict types: 1.5 is rounded to 2. Without: TypeError.",
          "declare(strict_types=1) only affects return types, not parameter types",
        ],
        answer: 1,
        explanation: "Without strict types, PHP silently coerces compatible scalars (float to int truncates toward zero). With strict types, every type mismatch is a TypeError — no silent coercion. Note: declare(strict_types=1) only affects the file it is declared in.",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
const WEEK2_DAYS: NewDay[] = [DAY8, DAY9, DAY10, DAY11, DAY12, DAY13];

async function main() {
  await initDatabase();

  // ── Find Phase 0 ──────────────────────────────────────────────────────────
  const phase = await Phase.findOne({ where: { order: 0 } });
  if (!phase) throw new Error("Phase 0 not found in database. Run db:seed first.");

  // ── Find Week 2 (order = 1, 0-indexed) ───────────────────────────────────
  const week = await Week.findOne({ where: { phaseId: phase.id, order: 1 } });
  if (!week) throw new Error("Week 2 (order=1) not found in Phase 0. Run db:seed first.");

  console.log(`\n🔄 Updating: ${phase.label} / ${week.label} (id=${week.id})\n`);

  // ── Delete existing days (CASCADE removes reading_items, quiz_questions, etc.) ──
  console.log("🗑️  Removing existing days...");
  await Day.destroy({ where: { weekId: week.id } });

  // ── Update week name ──────────────────────────────────────────────────────
  await Week.update(
    { name: "PHP Patterns Every Developer Should Know" },
    { where: { id: week.id } }
  );

  // ── Insert new days ───────────────────────────────────────────────────────
  console.log("📝 Inserting new days...\n");

  for (let di = 0; di < WEEK2_DAYS.length; di++) {
    const dayData = WEEK2_DAYS[di];
    const act = dayData.activity;

    const day = await Day.create({
      weekId: week.id,
      order: di,
      dayLabel: dayData.day,
      title: dayData.title,
      goal: dayData.goal,
      activityType: act.type,
      activityTitle: act.title ?? null,
      activityIntro: act.intro ?? null,
      aiPrompt: act.type === "ai_open" ? (act.prompt ?? null) : null,
      aiCheckGoal: act.type === "ai_open" ? (act.checkGoal ?? null) : null,
    });

    // Reading items
    for (let ri = 0; ri < dayData.reading.length; ri++) {
      const r = dayData.reading[ri];
      await ReadingItem.create({
        dayId: day.id,
        order: ri,
        title: r.title,
        body: r.body,
        link: r.link ?? null,
      });
    }

    // Quiz questions
    if (act.questions) {
      for (let qi = 0; qi < act.questions.length; qi++) {
        const q = act.questions[qi];
        await QuizQuestion.create({
          dayId: day.id,
          order: qi,
          q: q.q,
          options: JSON.stringify(q.options),
          answer: q.answer,
          explanation: q.explanation,
        });
      }
    }

    // Hands-on steps
    if (act.steps) {
      for (let si = 0; si < act.steps.length; si++) {
        const s = act.steps[si];
        await HandsOnStep.create({
          dayId: day.id,
          order: si,
          n: s.n,
          title: s.title,
          body: s.body ?? null,
          code: s.code ?? null,
        });
      }
    }

    // AI check
    if (act.aiCheck) {
      await AiCheck.create({
        dayId: day.id,
        prompt: act.aiCheck.prompt,
        checkGoal: act.aiCheck.checkGoal,
      });
    }

    console.log(`  ✓ ${dayData.day}: ${dayData.title} (${act.type})`);
  }

  console.log(`\n✅ Phase 0 Week 2 updated — ${WEEK2_DAYS.length} days replaced.\n`);
}

main().catch(err => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
