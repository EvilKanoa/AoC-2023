import { Solver, SparseGrid, modulo } from "shared";

// \--- Day 21: Step Counter ---
// -----------------------------
//
// You manage to catch the [airship](7) right as it's dropping someone else off on their all-expenses-paid trip to Desert Island! It even helpfully drops you off near the [gardener](5) and his massive farm.
//
// "You got the sand flowing again! Great work! Now we just need to wait until we have enough sand to filter the water for Snow Island and we'll have snow again in no time."
//
// While you wait, one of the Elves that works with the gardener heard how good you are at solving problems and would like your help. He needs to get his [steps](https://en.wikipedia.org/wiki/Pedometer) in for the day, and so he'd like to know _which garden plots he can reach with exactly his remaining `64` steps_.
//
// He gives you an up-to-date map (your puzzle input) of his starting position (`S`), garden plots (`.`), and rocks (`#`). For example:
//
//     ...........
//     .....###.#.
//     .###.##..#.
//     ..#.#...#..
//     ....#.#....
//     .##..S####.
//     .##..#...#.
//     .......##..
//     .##.#.####.
//     .##..##.##.
//     ...........
//
//
// The Elf starts at the starting position (`S`) which also counts as a garden plot. Then, he can take one step north, south, east, or west, but only onto tiles that are garden plots. This would allow him to reach any of the tiles marked `O`:
//
//     ...........
//     .....###.#.
//     .###.##..#.
//     ..#.#...#..
//     ....#O#....
//     .##.OS####.
//     .##..#...#.
//     .......##..
//     .##.#.####.
//     .##..##.##.
//     ...........
//
//
// Then, he takes a second step. Since at this point he could be at _either_ tile marked `O`, his second step would allow him to reach any garden plot that is one step north, south, east, or west of _any_ tile that he could have reached after the first step:
//
//     ...........
//     .....###.#.
//     .###.##..#.
//     ..#.#O..#..
//     ....#.#....
//     .##O.O####.
//     .##.O#...#.
//     .......##..
//     .##.#.####.
//     .##..##.##.
//     ...........
//
//
// After two steps, he could be at any of the tiles marked `O` above, including the starting position (either by going north-then-south or by going west-then-east).
//
// A single third step leads to even more possibilities:
//
//     ...........
//     .....###.#.
//     .###.##..#.
//     ..#.#.O.#..
//     ...O#O#....
//     .##.OS####.
//     .##O.#...#.
//     ....O..##..
//     .##.#.####.
//     .##..##.##.
//     ...........
//
//
// He will continue like this until his steps for the day have been exhausted. After a total of `6` steps, he could reach any of the garden plots marked `O`:
//
//     ...........
//     .....###.#.
//     .###.##.O#.
//     .O#O#O.O#..
//     O.O.#.#.O..
//     .##O.O####.
//     .##.O#O..#.
//     .O.O.O.##..
//     .##.#.####.
//     .##O.##.##.
//     ...........
//
//
// In this example, if the Elf's goal was to get exactly `6` more steps today, he could use them to reach any of `_16_` garden plots.
//
// However, the Elf _actually needs to get `64` steps today_, and the map he's handed you is much larger than the example map.
//
// Starting from the garden plot marked `S` on your map, _how many garden plots could the Elf reach in exactly `64` steps?_

enum Tile {
  START = "S",
  PLOT = ".",
  ROCK = "#",
}

const parseMap = (
  lines: string[]
): { map: SparseGrid<Tile>; start: [number, number] } => {
  const map = SparseGrid.fromLines(
    lines,
    (c) => c as Tile,
    (x, y, map) =>
      map.get(
        modulo(x, map.extents()[0][1] + 1),
        modulo(y, map.extents()[1][1] + 1)
      ),
    undefined,
    0
  );
  const startCell = map
    .sparseCells()
    .find(({ value }) => value === Tile.START)!;
  map.set(startCell.x, startCell.y, Tile.PLOT);
  return { map, start: [startCell.x, startCell.y] };
};

export const partA = (lines: string[], goal = 64) => {
  const {
    map,
    start: [sx, sy],
  } = parseMap(lines);
  const possibilities = new SparseGrid<boolean>(false).set(sx, sy, true);

  for (let step = 0; step < goal; step++) {
    const lastSteps = possibilities.sparseCells();
    possibilities.clear();

    for (const { x, y } of lastSteps) {
      map
        .adjacent(x, y, 1, false)
        .filter((next) => next.value === Tile.PLOT)
        .forEach((next) => {
          possibilities.set(next.x, next.y, true);
        });
    }
  }

  return possibilities.size();
};

export const partB = (lines: string[], goal = 1 /*26_501_365*/) => {
  const {
    map,
    start: [sx, sy],
  } = parseMap(lines);
  const possibilities = new SparseGrid<boolean>(false).set(sx, sy, true);

  for (let step = 0; step < goal; step++) {
    const lastSteps = possibilities.sparseCells();
    possibilities.clear();

    // if (step % 100 === 0) {
    //   console.log({ step, possibilities: lastSteps.length });
    // }

    for (const { x, y } of lastSteps) {
      map
        .adjacent(x, y, 1, false)
        .filter((next) => next.value === Tile.PLOT)
        .forEach((next) => {
          possibilities.set(next.x, next.y, true);
        });
    }
  }

  return possibilities.size();
};
