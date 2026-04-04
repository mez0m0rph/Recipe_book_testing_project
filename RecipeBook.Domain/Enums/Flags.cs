using System;

namespace RecipeBook.Domain.Enums;

[Flags]
public enum Flags
{
    None = 0,
    Vegan = 1,
    GlutenFree = 2,
    SugarFree = 4
}