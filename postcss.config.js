// PostCSS設定 - ブラウザ互換性のためのAutoprefixer設定
export default {
  plugins: {
    autoprefixer: {
      // Chrome 118未満バージョンとSamsung Internet対応のための設定
      overrideBrowserslist: [
        "> 1%",           // 1%以上の使用率を持つブラウザ
        "last 2 versions", // 最新2バージョン
        "not dead",       // サポート終了ブラウザを除外
        "Chrome >= 80",   // Chrome 80以上
        "Samsung >= 10"   // Samsung Internet 10以上
      ],
      // CSS論理プロパティ(logical properties)のフォールバック生成
      flexbox: "no-2009",
      grid: "autoplace"
    }
  }
};
