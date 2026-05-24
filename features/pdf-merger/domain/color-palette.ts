export class FileColorPalette {
  private index = 0;

  constructor(private readonly colors: readonly string[]) {}

  nextColor(): string {
    return this.colors[this.index++ % this.colors.length];
  }
}
