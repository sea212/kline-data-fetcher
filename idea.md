I need a tool that downloads all historical kline data from binance.vision. The user can supply a path to the tool where data should be stored. the historical kline data should be stored in the following way: "<data_path>/<symbol>/<kline-csv-data-files>".

The website is: "https://data.binance.vision/?prefix=data/spot/monthly/klines/"

In the HTML code of that website, you can find urls with the following format: "https://data.binance.vision/?prefix=data/spot/monthly/klines/SYMBOL/", for example "https://data.binance.vision/?prefix=data/spot/monthly/klines/BTCUSDT"
Append "/1m/" to the url path, for example "https://data.binance.vision/?prefix=data/spot/monthly/klines/BTCUSDT/1m/".
Within the appended path, scan for links to zip files, but ensure to avoid ".zip.CHECKSUM" files. For example, the following file should be found and downloaded: "https://data.binance.vision/data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2026-01.zip".
Extract the zip file and put it's content into the correct folder, for example "<data_path>/BTCUSDT/BTCUSDT-1m-2026-01.csv".
