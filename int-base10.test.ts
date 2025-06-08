/**
 * TypeScript Generic 10進整数演算ライブラリ テストスイート
 * 
 * このファイルは int-base10.ts ライブラリの機能をテストします。
 * 各テストケースは型レベルでの演算が正しく動作することを検証します。
 */

/* _____________ テストケース _____________ */

import type {
    IntBase10Type,
    IntBase10,
    ZERO,
    ONE,
    IntBase10toN,
    IntBase10toBI,
    IntBase10toS,
    Neg,
    Add,
    Mul,
    Div,
    Mod,
    Inc,
    Dec,
    Sub,
    DivMod,
    Gt,
    Gte,
    Lt,
    Lte
} from './int-base10'

// ============================================================================
// ヘルパー型
// ============================================================================

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false
export type Expect<T extends true> = T
export type ExpectFalse<T extends false> = T
export type ExpectExtends<X, Y> = X extends Y ? true : false

/**
 * 除算の結果が正しいことを検証するヘルパー型
 * x = y * q + r の関係が成り立つことを確認
 */
type DivModRestores<X extends number, Y extends number> = Equal< Add<Mul<Div<X, Y>, Y>, Mod<X, Y>>, X>

// ============================================================================
// 型変換・コンストラクタのテスト
// ============================================================================

/**
 * IntBase10型の構築と型変換機能をテスト
 * - 数値、文字列からのIntBase10型構築
 * - IntBase10型から数値、文字列への変換
 * - 正の数、負の数、ゼロの正しい表現
 */
type ConstructorAndConversionTests = [
    // IntBase10型の構築テスト
    ExpectExtends<IntBase10<0>, IntBase10Type>,
    ExpectExtends<IntBase10<325>, IntBase10Type>,
    ExpectExtends<IntBase10<-325>, IntBase10Type>,

    // 定数との等価性テスト
    Expect<Equal< IntBase10<0> , ZERO >>,
    Expect<Equal< IntBase10<-0> , ZERO >>,
    Expect<Equal< IntBase10<1> , ONE >>,

    // 内部表現の正確性テスト
    Expect<Equal< IntBase10<100> , {p: [1,0,0], n: []} >>,
    Expect<Equal< IntBase10<-99> , {p: [], n: [9,9]} >>,
    Expect<Equal< IntBase10<"574382943"> , {p: [5,7,4,3,8,2,9,4,3], n: []} >>,
    Expect<Equal< IntBase10<"-1145141919"> , {p: [], n: [1,1,4,5,1,4,1,9,1,9]} >>,

    // IntBase10型から数値への変換テスト
    Expect<Equal< IntBase10toN<IntBase10<-99>> , -99 >>,
    Expect<Equal< IntBase10toN<IntBase10<359>> , 359 >>,
    Expect<Equal< IntBase10toN<IntBase10<0>> , 0 >>,
    Expect<Equal< IntBase10toN<IntBase10<768954278945>> , 768954278945 >>,
    
    // 安全な整数範囲の境界値テスト
    Expect<Equal< IntBase10toN<IntBase10<9007199254740991>> , 9007199254740991 >>,  // MAX_SAFE_INTEGER
    
    // 安全な整数範囲を超える場合はbigintで返すテスト（コメントアウト - 型システムの制約により一時的に無効化）
    Expect<Equal< IntBase10toBI<IntBase10<"9007199254740992">> , 9007199254740992n >>,  // MAX_SAFE_INTEGER + 1
    Expect<Equal< IntBase10toBI<IntBase10<"12345678901234567890">> , 12345678901234567890n >>, // 大きな数値

    // IntBase10型から文字列への変換テスト
    Expect<Equal< IntBase10toS<IntBase10<-99>> , '-99' >>,
    Expect<Equal< IntBase10toS<IntBase10<359>> , '359' >>,
    Expect<Equal< IntBase10toS<IntBase10<0>> , '0' >>,
    Expect<Equal< IntBase10toS<IntBase10<768954278945>> , '768954278945' >>,
]

// ============================================================================
// 単項演算のテスト
// ============================================================================

/**
 * 単項演算子の動作をテスト
 * - 符号反転（Neg）
 * - インクリメント（Inc）
 * - デクリメント（Dec）
 */
type UnaryOperationTests = [
    // 符号反転テスト
    Expect<Equal< Neg<1> ,-1>>,
    Expect<Equal< Neg<56289> ,-56289>>,

    // インクリメントテスト
    Expect<Equal< Inc<0>, 1>>,
    Expect<Equal< Inc<1>, 2>>,
    Expect<Equal< Inc<-1>, 0>>,
    Expect<Equal< Inc<9999>, 10000>>,      // 桁上がりのテスト
    Expect<Equal< Inc<-10000>, -9999>>,    // 負数のインクリメント

    // デクリメントテスト
    Expect<Equal< Dec<0>, -1>>,
    Expect<Equal< Dec<1>, 0>>,
    Expect<Equal< Dec<-1>, -2>>,
    Expect<Equal< Dec<10000>, 9999>>,      // 桁下がりのテスト
    Expect<Equal< Dec<-9999>, -10000>>,    // 負数のデクリメント
]

// ============================================================================
// 比較演算のテスト
// ============================================================================

/**
 * 比較演算子の動作をテスト
 * - より大きい（Gt）
 * - 以上（Gte）
 * - より小さい（Lt）
 * - 以下（Lte）
 * 
 * 正の数、負の数、ゼロの組み合わせで包括的にテスト
 */
type ComparisonOperationTests = [
    // Gt（より大きい）のテスト - true になるケース
    Expect<Gt<10, 9>>,
    Expect<Gt<9, 8>>,
    Expect<Gt<1, 0>>,
    Expect<Gt<1, -3>>,        // 正 > 負
    Expect<Gt<0, -3>>,        // ゼロ > 負
    Expect<Gt<-2, -3>>,       // 負同士の比較
    Expect<Gt<-20, -30>>,

    // Gt（より大きい）のテスト - false になるケース
    ExpectFalse<Gt<9, 10>>,
    ExpectFalse<Gt<8, 9>>,
    ExpectFalse<Gt<0, 1>>,
    ExpectFalse<Gt<-3, 1>>,   // 負 < 正
    ExpectFalse<Gt<-3, 0>>,   // 負 < ゼロ
    ExpectFalse<Gt<-3, -2>>,  // 負同士の比較
    ExpectFalse<Gt<3, 3>>,    // 等しい場合
    ExpectFalse<Gt<0, 0>>,
    ExpectFalse<Gt<-10,-10>>,
    ExpectFalse<Gt<10, 10>>,

    // Gte（以上）のテスト - true になるケース
    Expect<Gte<10, 9>>,
    Expect<Gte<9, 8>>,
    Expect<Gte<1, 0>>,
    Expect<Gte<1, -3>>,
    Expect<Gte<0, -3>>,
    Expect<Gte<-2, -3>>,
    Expect<Gte<-20, -30>>,
    Expect<Gte<3, 3>>,        // 等しい場合
    Expect<Gte<0, 0>>,
    Expect<Gte<-10,-10>>,
    Expect<Gte<10, 10>>,

    // Gte（以上）のテスト - false になるケース
    ExpectFalse<Gte<9, 10>>,
    ExpectFalse<Gte<8, 9>>,
    ExpectFalse<Gte<0, 1>>,
    ExpectFalse<Gte<-3, 1>>,
    ExpectFalse<Gte<-3, 0>>,
    ExpectFalse<Gte<-3, -2>>,

    // Lt（より小さい）のテスト - false になるケース
    ExpectFalse<Lt<10, 9>>,
    ExpectFalse<Lt<9, 8>>,
    ExpectFalse<Lt<1, 0>>,
    ExpectFalse<Lt<1, -3>>,
    ExpectFalse<Lt<0, -3>>,
    ExpectFalse<Lt<-2, -3>>,
    ExpectFalse<Lt<-20, -30>>,
    ExpectFalse<Lt<3, 3>>,    // 等しい場合
    ExpectFalse<Lt<0, 0>>,
    ExpectFalse<Lt<-10,-10>>,
    ExpectFalse<Lt<10, 10>>,

    // Lt（より小さい）のテスト - true になるケース
    Expect<Lt<9, 10>>,
    Expect<Lt<8, 9>>,
    Expect<Lt<0, 1>>,
    Expect<Lt<-3, 1>>,
    Expect<Lt<-3, 0>>,
    Expect<Lt<-3, -2>>,

    // Lte（以下）のテスト - false になるケース
    ExpectFalse<Lte<10, 9>>,
    ExpectFalse<Lte<9, 8>>,
    ExpectFalse<Lte<1, 0>>,
    ExpectFalse<Lte<1, -3>>,
    ExpectFalse<Lte<0, -3>>,
    ExpectFalse<Lte<-2, -3>>,
    ExpectFalse<Lte<-20, -30>>,

    // Lte（以下）のテスト - true になるケース
    Expect<Lte<9, 10>>,
    Expect<Lte<8, 9>>,
    Expect<Lte<0, 1>>,
    Expect<Lte<-3, 1>>,
    Expect<Lte<-3, 0>>,
    Expect<Lte<-3, -2>>,
    Expect<Lte<3, 3>>,        // 等しい場合
    Expect<Lte<0, 0>>,
    Expect<Lte<-10,-10>>,
    Expect<Lte<10, 10>>,
]

// ============================================================================
// 二項演算のテスト
// ============================================================================

/**
 * 二項演算子の動作をテスト
 * - 加算（Add）
 * - 減算（Sub）
 * - 乗算（Mul）
 * - 除算と剰余（DivMod, Div, Mod）
 * 
 * 正の数、負の数、ゼロの組み合わせで包括的にテスト
 */
type BinaryOperationTests = [
    // ========================================
    // 加算（Add）のテスト
    // ========================================
    Expect<Equal< Add<1, 2>, 3>>,
    Expect<Equal< Add<0, 125>, 125>>,      // ゼロとの加算
    Expect<Equal< Add<0, -125>, -125>>,
    Expect<Equal< Add<0, 0>, 0>>,
    Expect<Equal< Add<99999999, 1>, 100000000>>,  // 桁上がりのテスト
    Expect<Equal< Add<125, 0>, 125>>,
    Expect<Equal< Add<125, 384>, 509>>,    // 正 + 正
    Expect<Equal< Add<125, -120>, 5>>,     // 正 + 負（正の結果）
    Expect<Equal< Add<125, -125>, 0>>,     // 正 + 負（ゼロ）
    Expect<Equal< Add<125, -250>, -125>>,  // 正 + 負（負の結果）
    Expect<Equal< Add<-125, 0>, -125>>,
    Expect<Equal< Add<-125, -384>, -509>>, // 負 + 負
    Expect<Equal< Add<-125, 120>, -5>>,    // 負 + 正（負の結果）
    Expect<Equal< Add<-125, 125>, 0>>,     // 負 + 正（ゼロ）
    Expect<Equal< Add<-125, 250>, 125>>,   // 負 + 正（正の結果）

    // ========================================
    // 減算（Sub）のテスト
    // ========================================
    Expect<Equal< Sub<-125, 250>, -375>>,  // 負 - 正
    Expect<Equal< Sub<125, 250>, -125>>,   // 正 - 正（負の結果）

    // ========================================
    // 乗算（Mul）のテスト
    // ========================================
    Expect<Equal< Mul<128, 32>, 4096>>,    // 正 × 正
    Expect<Equal< Mul<128, -32>, -4096>>,  // 正 × 負
    Expect<Equal< Mul<-128, 32>, -4096>>,  // 負 × 正
    Expect<Equal< Mul<-128, -32>, 4096>>,  // 負 × 負
    Expect<Equal< Mul<25, 0>, 0>>,         // ゼロとの乗算
    Expect<Equal< Mul<-25, 0>, 0>>,
    Expect<Equal< Mul<0, 653>, 0>>,
    Expect<Equal< Mul<0, 653>, 0>>,
    Expect<Equal< Mul<0, 0>, 0>>,
    Expect<Equal< Mul<568942, 1734982>, 987104129044>>,  // 大きな数の乗算

    // ========================================
    // 除算と剰余（DivMod）のテスト
    // ========================================
    
    // 基本的な除算テスト
    Expect<Equal<DivMod<34, 5>, {div: 6, mod: 4}>>,      // 正 ÷ 正
    Expect<Equal<DivMod<34, -5>, {div: -6, mod: 4}>>,    // 正 ÷ 負
    Expect<Equal<DivMod<-34, 5>, {div: -7, mod: 1}>>,    // 負 ÷ 正
    Expect<Equal<DivMod<-34, -5>, {div: 7, mod: 1}>>,    // 負 ÷ 負

    // 大きな数の除算テスト
    Expect<Equal<DivMod<85749283, 6547820>, {div: 13, mod: 627623}>>,
    Expect<Equal<DivMod<85749283, -6547820>, {div: -13, mod: 627623}>>,
    Expect<Equal<DivMod<-85749283, 6547820>, {div: -14, mod: 5920197}>>,
    Expect<Equal<DivMod<-85749283, -6547820>, {div: 14, mod: 5920197}>>,

    // 割り切れる場合のテスト
    Expect<Equal<DivMod<420, 2>, {div: 210, mod: 0}>>,
    Expect<Equal<DivMod<10000, 2>, {div: 5000, mod: 0}>>,

    // ゼロ除算のテスト（neverになることを確認）
    Expect<Equal<DivMod<7689524, 0>, {div: never, mod: never}>>,
    Expect<Equal<DivMod<-7689524, 0>, {div: never, mod: never}>>,

    // ゼロの除算テスト
    Expect<Equal<DivMod<0, 7689524>, {div: 0, mod: 0}>>,
    Expect<Equal<DivMod<0, -7689524>, {div: 0, mod: 0}>>,

    // ========================================
    // 除算の正確性検証テスト
    // ========================================
    
    // x = y * q + r の関係が成り立つことを確認
    Expect<DivModRestores<85749283, 6547820>>,
    Expect<DivModRestores<85749283, -6547820>>,
    Expect<DivModRestores<-85749283, 6547820>>,
    Expect<DivModRestores<-85749283, -6547820>>,

    // ========================================
    // Div, Mod の一貫性テスト
    // ========================================
    
    // DivMod の結果と Div, Mod の結果が一致することを確認
    Expect<Equal<DivMod<34, 5>, {div: Div<34, 5>, mod: Mod<34, 5>}>>,
    Expect<Equal<DivMod<34, -5>, {div: Div<34, -5>, mod: Mod<34, -5>}>>,
    Expect<Equal<DivMod<-34, 5>, {div: Div<-34, 5>, mod: Mod<-34, 5>}>>,
    Expect<Equal<DivMod<-34, -5>, {div: Div<-34, -5>, mod: Mod<-34, -5>}>>,
]

// ============================================================================
// 実用的な使用例のテスト
// ============================================================================

/**
 * READMEで紹介した実用的な使用例をテスト
 * - 階乗の計算
 * - フィボナッチ数列
 * - 大きな数値の演算
 */

// 階乗の計算
type Factorial<N extends number, Acc extends number = 1, I extends number = 1> =
  Gt<I, N> extends true ? Acc : Factorial<N, Mul<Acc, I>, Inc<I>>

// フィボナッチ数列
type Fibonacci<N extends number, A extends number = 0, B extends number = 1, I extends number = 0> =
  I extends N ? A : Fibonacci<N, B, Add<A, B>, Inc<I>>

type UsageExampleTests = [
    // ========================================
    // 階乗の計算テスト
    // ========================================
    Expect<Equal<Factorial<0>, 1>>,        // 0! = 1
    Expect<Equal<Factorial<1>, 1>>,        // 1! = 1
    Expect<Equal<Factorial<2>, 2>>,        // 2! = 2
    Expect<Equal<Factorial<3>, 6>>,        // 3! = 6
    Expect<Equal<Factorial<4>, 24>>,       // 4! = 24
    Expect<Equal<Factorial<5>, 120>>,      // 5! = 120
    Expect<Equal<Factorial<6>, 720>>,      // 6! = 720
    Expect<Equal<Factorial<7>, 5040>>,     // 7! = 5040

    // ========================================
    // フィボナッチ数列テスト
    // ========================================
    Expect<Equal<Fibonacci<0>, 0>>,        // F(0) = 0
    Expect<Equal<Fibonacci<1>, 1>>,        // F(1) = 1
    Expect<Equal<Fibonacci<2>, 1>>,        // F(2) = 1
    Expect<Equal<Fibonacci<3>, 2>>,        // F(3) = 2
    Expect<Equal<Fibonacci<4>, 3>>,        // F(4) = 3
    Expect<Equal<Fibonacci<5>, 5>>,        // F(5) = 5
    Expect<Equal<Fibonacci<6>, 8>>,        // F(6) = 8
    Expect<Equal<Fibonacci<7>, 13>>,       // F(7) = 13
    Expect<Equal<Fibonacci<8>, 21>>,       // F(8) = 21
    Expect<Equal<Fibonacci<9>, 34>>,       // F(9) = 34
    Expect<Equal<Fibonacci<10>, 55>>,      // F(10) = 55

    // ========================================
    // 大きな数値の演算テスト
    // ========================================
    
    // JavaScriptの安全な整数範囲を超えた計算
    Expect<Equal<Add<"999999999999999999", "1">, "1000000000000000000">>,
    Expect<Equal<Mul<"123456789", "987654321">, "121932631112635269">>,

    // 文字列での大きな数値演算
    Expect<Equal<Add<"999", "1">, "1000">>,
    Expect<Equal<Mul<"999", "2">, "1998">>,
    Expect<Equal<Div<"100", "3">, "33">>,
    Expect<Equal<Mod<"100", "3">, "1">>,
    
    // 非常に大きな数値の基本演算
    Expect<Equal<Add<"12345678901234567890", "98765432109876543210">, "111111111011111111100">>,
    Expect<Equal<Sub<"98765432109876543210", "12345678901234567890">, "86419753208641975320">>,
    Expect<Equal<Add<12345678901234567890n, 98765432109876543210n>, 111111111011111111100n>>,
    Expect<Equal<Sub<98765432109876543210n, 12345678901234567890n>, 86419753208641975320n>>,
]
