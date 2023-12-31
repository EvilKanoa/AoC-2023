import { Range, Solver, keyBy, split, sum } from "shared";

// \--- Day 19: Aplenty ---
// ------------------------
//
// The Elves of Gear Island are thankful for your help and send you on your way. They even have a hang glider that someone [stole](9) from Desert Island; since you're already going that direction, it would help them a lot if you would use it to get down there and return it to them.
//
// As you reach the bottom of the _relentless avalanche of machine parts_, you discover that they're already forming a formidable heap. Don't worry, though - a group of Elves is already here organizing the parts, and they have a _system_.
//
// To start, each part is rated in each of four categories:
//
// *   `x`: E_x_tremely cool looking
// *   `m`: _M_usical (it makes a noise when you hit it)
// *   `a`: _A_erodynamic
// *   `s`: _S_hiny
//
// Then, each part is sent through a series of _workflows_ that will ultimately _accept_ or _reject_ the part. Each workflow has a name and contains a list of _rules_; each rule specifies a condition and where to send the part if the condition is true. The first rule that matches the part being considered is applied immediately, and the part moves on to the destination described by the rule. (The last rule in each workflow has no condition and always applies if reached.)
//
// Consider the workflow `ex{x>10:one,m<20:two,a>30:R,A}`. This workflow is named `ex` and contains four rules. If workflow `ex` were considering a specific part, it would perform the following steps in order:
//
// *   Rule "`x>10:one`": If the part's `x` is more than `10`, send the part to the workflow named `one`.
// *   Rule "`m<20:two`": Otherwise, if the part's `m` is less than `20`, send the part to the workflow named `two`.
// *   Rule "`a>30:R`": Otherwise, if the part's `a` is more than `30`, the part is immediately _rejected_ (`R`).
// *   Rule "`A`": Otherwise, because no other rules matched the part, the part is immediately _accepted_ (`A`).
//
// If a part is sent to another workflow, it immediately switches to the start of that workflow instead and never returns. If a part is _accepted_ (sent to `A`) or _rejected_ (sent to `R`), the part immediately stops any further processing.
//
// The system works, but it's not keeping up with the torrent of weird metal shapes. The Elves ask if you can help sort a few parts and give you the list of workflows and some part ratings (your puzzle input). For example:
//
//     px{a<2006:qkq,m>2090:A,rfg}
//     pv{a>1716:R,A}
//     lnx{m>1548:A,A}
//     rfg{s<537:gd,x>2440:R,A}
//     qs{s>3448:A,lnx}
//     qkq{x<1416:A,crn}
//     crn{x>2662:A,R}
//     in{s<1351:px,qqz}
//     qqz{s>2770:qs,m<1801:hdj,R}
//     gd{a>3333:R,R}
//     hdj{m>838:A,pv}
//
//     {x=787,m=2655,a=1222,s=2876}
//     {x=1679,m=44,a=2067,s=496}
//     {x=2036,m=264,a=79,s=2244}
//     {x=2461,m=1339,a=466,s=291}
//     {x=2127,m=1623,a=2188,s=1013}
//
//
// The workflows are listed first, followed by a blank line, then the ratings of the parts the Elves would like you to sort. All parts begin in the workflow named `in`. In this example, the five listed parts go through the following workflows:
//
// *   `{x=787,m=2655,a=1222,s=2876}`: `in` -> `qqz` -> `qs` -> `lnx` -> `_A_`
// *   `{x=1679,m=44,a=2067,s=496}`: `in` -> `px` -> `rfg` -> `gd` -> `_R_`
// *   `{x=2036,m=264,a=79,s=2244}`: `in` -> `qqz` -> `hdj` -> `pv` -> `_A_`
// *   `{x=2461,m=1339,a=466,s=291}`: `in` -> `px` -> `qkq` -> `crn` -> `_R_`
// *   `{x=2127,m=1623,a=2188,s=1013}`: `in` -> `px` -> `rfg` -> `_A_`
//
// Ultimately, three parts are _accepted_. Adding up the `x`, `m`, `a`, and `s` rating for each of the accepted parts gives `7540` for the part with `x=787`, `4623` for the part with `x=2036`, and `6951` for the part with `x=2127`. Adding all of the ratings for _all_ of the accepted parts gives the sum total of `_19114_`.
//
// Sort through all of the parts you've been given; _what do you get if you add together all of the rating numbers for all of the parts that ultimately get accepted?_

interface Part {
  x: number;
  m: number;
  a: number;
  s: number;
}

enum PartResult {
  ACCEPTED = "A",
  REJECTED = "R",
}
enum WorkflowConditionType {
  GREATER_THAN = ">",
  LESS_THAN = "<",
}
type WorkflowKey = string;
type WorkflowResult = PartResult | WorkflowKey;

interface WorkflowRule {
  condition:
    | { default: true }
    | {
        type: WorkflowConditionType;
        category: keyof Part;
        threshold: number;
      };
  result: WorkflowResult;
}

interface Workflow {
  key: WorkflowKey;
  rules: WorkflowRule[];
}

const parseWorkflow = (line: string): Workflow => {
  const [key, ruleStrings] = line.split("{");

  const rules: WorkflowRule[] = [];
  for (const ruleStr of ruleStrings.replace("}", "").split(",")) {
    if (ruleStr.includes(":")) {
      // conditional rule
      const type = ruleStr.includes(">")
        ? WorkflowConditionType.GREATER_THAN
        : WorkflowConditionType.LESS_THAN;

      const [category, threshold, result] = ruleStr.split(/[<>:]/g);

      rules.push({
        condition: {
          type,
          category: category as keyof Part,
          threshold: parseInt(threshold, 10),
        },
        result,
      });
    } else {
      // default rule
      rules.push({ condition: { default: true }, result: ruleStr });
    }
  }

  return { key, rules };
};

const parsePart = (line: string): Part => {
  const part = { x: 0, m: 0, a: 0, s: 0 };

  for (const cat of line.replace(/[{}]/g, "").split(",")) {
    const [catKey, valueStr] = cat.split("=");
    part[catKey as keyof Part] += parseInt(valueStr, 10);
  }

  return part;
};

const parseInput = (
  lines: string[]
): { workflows: Record<WorkflowKey, Workflow>; parts: Part[] } => {
  const [workflowLines, partLines] = split(lines, (line) => line.length === 0);

  return {
    workflows: keyBy(workflowLines.map(parseWorkflow), "key"),
    parts: partLines.map(parsePart),
  };
};

const processPart = (
  workflows: Record<WorkflowKey, Workflow>,
  part: Part
): boolean => {
  let current = "in";
  while (current !== PartResult.ACCEPTED && current !== PartResult.REJECTED) {
    for (const { condition, result } of workflows[current].rules) {
      if (
        "default" in condition ||
        (condition.type === WorkflowConditionType.GREATER_THAN &&
          part[condition.category] > condition.threshold) ||
        (condition.type === WorkflowConditionType.LESS_THAN &&
          part[condition.category] < condition.threshold)
      ) {
        current = result;
        break;
      }
    }
  }

  return current === PartResult.ACCEPTED;
};

export const partA: Solver = (lines: string[]) => {
  const { workflows, parts } = parseInput(lines);

  return parts
    .filter((part) => processPart(workflows, part))
    .map(({ x, m, a, s }) => x + m + a + s)
    .reduce(sum);
};

interface PartRange {
  x: Range;
  m: Range;
  a: Range;
  s: Range;
}

const ratingRange = () => new Range(1, 4000);

export const partB: Solver = (lines: string[]) => {
  const { workflows } = parseInput(lines);

  // tracks all part ranges which have been processed into the accepted state
  const accepted: PartRange[] = [];
  // contains part ranges which have not completed processing yet
  const queue: { range: PartRange; current: [WorkflowKey, number] }[] = [
    {
      range: {
        x: ratingRange(),
        m: ratingRange(),
        a: ratingRange(),
        s: ratingRange(),
      },
      current: ["in", 0],
    },
  ];

  // process all part ranges until rejected or accepted
  while (queue.length) {
    const { range, current } = queue.pop()!;

    // we just yeet everything into the queue and handle results and invalid states here
    if (current[0] === PartResult.ACCEPTED) {
      accepted.push(range);
      continue;
    } else if (
      current[0] === PartResult.REJECTED ||
      range.x.empty ||
      range.m.empty ||
      range.a.empty ||
      range.s.empty
    ) {
      continue;
    }

    // looks like we gotta do something, let's grab it
    const { condition, result } = workflows[current[0]].rules[current[1]];

    if ("default" in condition) {
      // default case of workflow, simply assign result
      queue.push({ range, current: [result, 0] });
    } else {
      // need to split the current range by the condition
      const { category, type, threshold } = condition;
      const [falseRange, trueRange] =
        type === WorkflowConditionType.LESS_THAN
          ? range[category].slice(threshold).reverse()
          : range[category].slice(threshold + 1);

      // since we account for empty ranges, we just yeet these into the queue
      queue.push(
        {
          range: { ...range, [category]: trueRange },
          current: [result, 0],
        },
        {
          range: { ...range, [category]: falseRange },
          current: [current[0], current[1] + 1],
        }
      );
    }
  }

  return accepted
    .map((r) => r.x.length * r.m.length * r.a.length * r.s.length)
    .reduce(sum);
};
