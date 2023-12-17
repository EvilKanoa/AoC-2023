import { Solver, sum } from "shared";

// \--- Day 9: Mirage Maintenance ---
// ----------------------------------
//
// You ride the camel through the sandstorm and stop where the ghost's maps told you to stop. The sandstorm subsequently subsides, somehow seeing you standing at an _oasis_!
//
// The camel goes to get some water and you stretch your neck. As you look up, you discover what must be yet another giant floating island, this one made of metal! That must be where the _parts to fix the sand machines_ come from.
//
// There's even a [hang glider](https://en.wikipedia.org/wiki/Hang_gliding) partially buried in the sand here; once the sun rises and heats up the sand, you might be able to use the glider and the hot air to get all the way up to the metal island!
//
// While you wait for the sun to rise, you admire the oasis hidden here in the middle of Desert Island. It must have a delicate ecosystem; you might as well take some ecological readings while you wait. Maybe you can report any environmental instabilities you find to someone so the oasis can be around for the next sandstorm-worn traveler.
//
// You pull out your handy _Oasis And Sand Instability Sensor_ and analyze your surroundings. The OASIS produces a report of many values and how they are changing over time (your puzzle input). Each line in the report contains the _history_ of a single value. For example:
//
//     0 3 6 9 12 15
//     1 3 6 10 15 21
//     10 13 16 21 30 45
//
//
// To best protect the oasis, your environmental report should include a _prediction of the next value_ in each history. To do this, start by making a new sequence from the _difference at each step_ of your history. If that sequence is _not_ all zeroes, repeat this process, using the sequence you just generated as the input sequence. Once all of the values in your latest sequence are zeroes, you can extrapolate what the next value of the original history should be.
//
// In the above dataset, the first history is `0 3 6 9 12 15`. Because the values increase by `3` each step, the first sequence of differences that you generate will be `3 3 3 3 3`. Note that this sequence has one fewer value than the input sequence because at each step it considers two numbers from the input. Since these values aren't _all zero_, repeat the process: the values differ by `0` at each step, so the next sequence is `0 0 0 0`. This means you have enough information to extrapolate the history! Visually, these sequences can be arranged like this:
//
//     0   3   6   9  12  15
//       3   3   3   3   3
//         0   0   0   0
//
//
// To extrapolate, start by adding a new zero to the end of your list of zeroes; because the zeroes represent differences between the two values above them, this also means there is now a placeholder in every sequence above it:
//
//     0   3   6   9  12  15   B
//       3   3   3   3   3   A
//         0   0   0   0   0
//
//
// You can then start filling in placeholders from the bottom up. `A` needs to be the result of increasing `3` (the value to its left) by `0` (the value below it); this means `A` must be `_3_`:
//
//     0   3   6   9  12  15   B
//       3   3   3   3   3   3
//         0   0   0   0   0
//
//
// Finally, you can fill in `B`, which needs to be the result of increasing `15` (the value to its left) by `3` (the value below it), or `_18_`:
//
//     0   3   6   9  12  15  18
//       3   3   3   3   3   3
//         0   0   0   0   0
//
//
// So, the next value of the first history is `_18_`.
//
// Finding all-zero differences for the second history requires an additional sequence:
//
//     1   3   6  10  15  21
//       2   3   4   5   6
//         1   1   1   1
//           0   0   0
//
//
// Then, following the same process as before, work out the next value in each sequence from the bottom up:
//
//     1   3   6  10  15  21  28
//       2   3   4   5   6   7
//         1   1   1   1   1
//           0   0   0   0
//
//
// So, the next value of the second history is `_28_`.
//
// The third history requires even more sequences, but its next value can be found the same way:
//
//     10  13  16  21  30  45  68
//        3   3   5   9  15  23
//          0   2   4   6   8
//            2   2   2   2
//              0   0   0
//
//
// So, the next value of the third history is `_68_`.
//
// If you find the next value for each history in this example and add them together, you get `_114_`.
//
// Analyze your OASIS report and extrapolate the next value for each history. _What is the sum of these extrapolated values?_

const parseLine = (line: string): number[] =>
  line
    .trim()
    .split(" ")
    .map((c) => parseInt(c, 10));

const withDifferences = (valueHist: number[]) => {
  const diffs = [valueHist];

  while (diffs[diffs.length - 1].some((n) => n !== 0)) {
    const lastDiff = diffs[diffs.length - 1];
    const newDiff = [];
    for (let i = 1; i < lastDiff.length; i++) {
      newDiff.push(lastDiff[i] - lastDiff[i - 1]);
    }
    diffs.push(newDiff);
  }

  return diffs;
};

const predict = (valueDiffs: number[][]): number => {
  const diffs = valueDiffs.map((d) => [...d]);

  diffs[diffs.length - 1].push(0);
  for (let i = diffs.length - 2; i >= 0; i--) {
    diffs[i].push(
      diffs[i][diffs[i].length - 1] + diffs[i + 1][diffs[i + 1].length - 1]
    );
  }

  return diffs[0][diffs[0].length - 1];
};

export const partA: Solver = (lines: string[]) => {
  const values = lines.map(parseLine).map(withDifferences);
  const predictions = values.map(predict);

  return predictions.reduce(sum);
};

const predictBackwards = (valueDiffs: number[][]): number => {
  const diffs = valueDiffs.map((d) => [...d]);

  diffs[diffs.length - 1] = [0, ...diffs[diffs.length - 1]];
  for (let i = diffs.length - 2; i >= 0; i--) {
    diffs[i] = [diffs[i][0] - diffs[i + 1][0], ...diffs[i]];
  }

  return diffs[0][0];
};

export const partB: Solver = (lines: string[]) => {
  const values = lines.map(parseLine).map(withDifferences);
  const predictions = values.map(predictBackwards);

  return predictions.reduce(sum);
};