# TypeScript Generic 10進整数演算ライブラリ

TypeScriptの型システムを使用して、**コンパイル時**に任意精度の10進整数演算を行うライブラリです。
[Type-Challenges](https://github.com/type-challenges/type-challenges) の問題を解いている時に触発されて作成しました。

## 特徴

- ✨ **コンパイル時演算**: TypeScriptの型システムを活用し、実行時ではなくコンパイル時に計算を実行
- 🔢 **任意精度**: JavaScriptの数値制限を超えた大きな整数の演算が可能
- 🎯 **型安全**: 全ての演算結果が型レベルで保証される
- 📦 **ゼロランタイム**: 実行時のオーバーヘッドなし
- 🔄 **柔軟な入力**: `number`、`bigint`、`string`、独自の`IntBase10Type`をサポート

## 基本的な使用方法

```typescript
import type { IntBase10, Add, Sub, Mul, Div, Mod } from 'ts-int-base10';

// 基本的な演算
type Sum = Add<123, 456>;        // 579
type Difference = Sub<1000, 1>;  // 999
type Product = Mul<12, 34>;      // 408
type Quotient = Div<100, 3>;     // 33
type Remainder = Mod<100, 3>;    // 1

// 文字列での大きな数値の演算
type BigSum = Add<"999999999999999999", "1">;  // "1000000000000000000"

// 負の数の演算
type NegResult = Add<-5, 3>;     // -2
```

## 内部表現

整数は `{p: DIGIT[], n: DIGIT[]}` の形式で表現されます：

- **正の数**: `p` に数字配列、`n` は空配列
- **負の数**: `n` に数字配列、`p` は空配列  
- **ゼロ**: `p`, `n` ともに空配列

```typescript
type Ten = IntBase10<10>;        // {p: [1, 0], n: []}
type MinusThirtyTwo = IntBase10<-32>; // {p: [], n: [3, 2]}
type Zero = IntBase10<0>;        // {p: [], n: []}
```

## API リファレンス

### 型変換・コンストラクタ

#### `IntBase10<I>`
整数値からIntBase10型を構築します。

```typescript
type Ten = IntBase10<10>;
type BigNumber = IntBase10<"123456789012345678901234567890">;
```

#### `IntBase10toS<X>` / `IntBase10toN<X>` / `IntBase10toBI<X>`
IntBase10型を文字列、数値、またはbigintに変換します。

```typescript
type StringResult = IntBase10toS<IntBase10<123>>;  // "123"
type NumberResult = IntBase10toN<IntBase10<"456">>; // 456
type BigIntResult = IntBase10toBI<IntBase10<"12345678901234567890">>; // 12345678901234567890n
```

### 定数

```typescript
type Zero = ZERO;      // ゼロ
type One = ONE;        // 1
type MinusOne = NEG_ONE; // -1
```

### 述語・判定

#### `IsPos<N>` / `IsNeg<N>` / `IsZero<N>`
数値の符号やゼロかどうかを判定します。

```typescript
type IsPositive = IsPos<5>;   // true
type IsNegative = IsNeg<-3>;  // true
type IsZeroValue = IsZero<0>; // true
```

#### `IsNonNeg<N>`
非負の値（0以上）かどうかを判定します。

```typescript
type IsNonNegative = IsNonNeg<0>; // true
```

### 単項演算

#### `Neg<N>` - 符号反転
```typescript
type Negated = Neg<5>;    // -5
type Positive = Neg<-3>;  // 3
```

#### `Abs<N>` - 絶対値
```typescript
type AbsoluteValue = Abs<-5>; // 5
```

#### `Sgn<N>` - 符号関数
```typescript
type Sign = Sgn<-5>;  // -1
type SignZero = Sgn<0>; // 0
type SignPos = Sgn<3>;  // 1
```

#### `Inc<N>` / `Dec<N>` - インクリメント/デクリメント
```typescript
type Incremented = Inc<5>;  // 6
type Decremented = Dec<5>;  // 4
```

### 比較演算

```typescript
type Equal = Eq<5, 5>;        // true
type Greater = Gt<5, 3>;      // true
type GreaterEqual = Gte<5, 5>; // true
type Less = Lt<3, 5>;         // true
type LessEqual = Lte<3, 5>;   // true
```

### 二項演算

#### `Add<X, Y>` - 加算
```typescript
type Sum = Add<123, 456>;           // 579
type BigSum = Add<"999", "1">;      // "1000"
```

#### `Sub<X, Y>` - 減算
```typescript
type Difference = Sub<456, 123>;    // 333
type NegDiff = Sub<3, 5>;          // -2
```

#### `Mul<X, Y>` - 乗算
```typescript
type Product = Mul<12, 34>;         // 408
type BigProduct = Mul<"999", 2>;    // "1998"
```

#### `Div<X, Y>` - 除算
```typescript
type Quotient = Div<17, 5>;         // 3
type BigQuotient = Div<"100", 3>;   // "33"
```

#### `Mod<X, Y>` - 剰余
```typescript
type Remainder = Mod<17, 5>;        // 2
type BigRemainder = Mod<"100", 3>;  // "1"
```

#### `DivMod<X, Y>` - 除算と剰余の同時計算
```typescript
type Result = DivMod<17, 5>;        // {div: 3, mod: 2}
```

## 使用例

### 階乗の計算
```typescript
type Factorial<N extends number, Acc extends number = 1, I extends number = 1> =
  Gt<I, N> extends true ? Acc : Factorial<N, Mul<Acc, I>, Inc<I>>;

type Fact5 = Factorial<5>; // 120
```

### フィボナッチ数列
```typescript
type Fibonacci<N extends number, A extends number = 0, B extends number = 1, I extends number = 0> =
  I extends N ? A : Fibonacci<N, B, Add<A, B>, Inc<I>>;

type Fib10 = Fibonacci<10>; // 55
```

### 大きな数値の演算
```typescript
// JavaScriptの安全な整数範囲を超えた計算
type BigSum = Add<"999999999999999999", "1">;  // "1000000000000000000"
type BigMul = Mul<"123456789", "987654321">;   // "121932631112635269"

// bigint型での変換
type BigIntResult = IntBase10toBI<IntBase10<"12345678901234567890">>; // 12345678901234567890n
```

## 制限事項

- TypeScriptの型システムの制約により、非常に大きな数値や深い再帰では型エラーが発生する可能性があります
- コンパイルやリンターが重くなる場合があります
- 実行時の値は含まれず、型レベルでのみ動作します

## ライセンス

MIT License