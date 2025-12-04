[Skip to content](https://github.com/opendatalab/MinerU/blob/master/README.md#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/opendatalab/MinerU/blob/master/README.md) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/opendatalab/MinerU/blob/master/README.md) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/opendatalab/MinerU/blob/master/README.md) to refresh your session.Dismiss alert

{{ message }}

[opendatalab](https://github.com/opendatalab)/ **[MinerU](https://github.com/opendatalab/MinerU)** Public

- [Notifications](https://github.com/login?return_to=%2Fopendatalab%2FMinerU) You must be signed in to change notification settings
- [Fork\\
4.1k](https://github.com/login?return_to=%2Fopendatalab%2FMinerU)
- [Star\\
49.8k](https://github.com/login?return_to=%2Fopendatalab%2FMinerU)


## Collapse file tree

## Files

master

Search this repository

/

# README.md

Copy path

BlameMore file actions

BlameMore file actions

## Latest commit

[![myhloli](https://avatars.githubusercontent.com/u/11393164?v=4&size=40)](https://github.com/myhloli)[myhloli](https://github.com/opendatalab/MinerU/commits?author=myhloli)

[fix: update documentation for mineru-api and improve concurrency sett…](https://github.com/opendatalab/MinerU/commit/e36ef652ee310096fe034c9472a1debc28b4fe8d)

Open commit detailssuccess

2 days agoDec 1, 2025

[e36ef65](https://github.com/opendatalab/MinerU/commit/e36ef652ee310096fe034c9472a1debc28b4fe8d) · 2 days agoDec 1, 2025

## History

[History](https://github.com/opendatalab/MinerU/commits/master/README.md)

Open commit details

[View commit history for this file.](https://github.com/opendatalab/MinerU/commits/master/README.md)

861 lines (750 loc) · 67.8 KB

/

# README.md

Top

## File metadata and controls

- Preview

- Code

- Blame


861 lines (750 loc) · 67.8 KB

[Raw](https://github.com/opendatalab/MinerU/raw/refs/heads/master/README.md)

Copy raw file

Download raw file

Outline

Edit and raw actions

[![](https://camo.githubusercontent.com/c27b0b0916f506bc307ab0375ea23e91e461e42e622db0cd2bb3b7b0d4e20dbd/68747470733a2f2f67636f72652e6a7364656c6976722e6e65742f67682f6f70656e646174616c61622f4d696e657255406d61737465722f646f63732f696d616765732f4d696e6572552d6c6f676f2e706e67)](https://camo.githubusercontent.com/c27b0b0916f506bc307ab0375ea23e91e461e42e622db0cd2bb3b7b0d4e20dbd/68747470733a2f2f67636f72652e6a7364656c6976722e6e65742f67682f6f70656e646174616c61622f4d696e657255406d61737465722f646f63732f696d616765732f4d696e6572552d6c6f676f2e706e67)

[![stars](https://camo.githubusercontent.com/0bbbeefaff3d40c46486a069d2939e94c04efd82c3a76c0868a2b7815b437aed/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f73746172732f6f70656e646174616c61622f4d696e6572552e737667)](https://github.com/opendatalab/MinerU)[![forks](https://camo.githubusercontent.com/d19f533442aaa9d6d2ec68a3b1bb54a126195b2fbb93209a308e25beebd01145/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f666f726b732f6f70656e646174616c61622f4d696e6572552e737667)](https://github.com/opendatalab/MinerU)[![open issues](https://camo.githubusercontent.com/9f37b56180a0d17e16e44428d1575a5f364a5d4b72305b6ff9d12668de0f62ce/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f6973737565732d7261772f6f70656e646174616c61622f4d696e657255)](https://github.com/opendatalab/MinerU/issues)[![issue resolution](https://camo.githubusercontent.com/f21b157ff65192e06c4e3d0a4b3cc3f4175de9a8f764438c02e46515dc24b943/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f6973737565732d636c6f7365642d7261772f6f70656e646174616c61622f4d696e657255)](https://github.com/opendatalab/MinerU/issues)[![PyPI version](https://camo.githubusercontent.com/98aed6928724870737a4f7dce0cbd21258bdfdebf266848763055cdd82abd3a4/68747470733a2f2f696d672e736869656c64732e696f2f707970692f762f6d696e657275)](https://pypi.org/project/mineru/)[![PyPI - Python Version](https://camo.githubusercontent.com/3074ec79bfd23f5838e8bde992015cff4fc630d29870cff0d50e49fc6b6fc296/68747470733a2f2f696d672e736869656c64732e696f2f707970692f707976657273696f6e732f6d696e657275)](https://pypi.org/project/mineru/)[![Downloads](https://camo.githubusercontent.com/9a0f2c7923375c155edf94404838ee5d62ac397e7b4899bb75c8157e39bf0bbc/68747470733a2f2f7374617469632e706570792e746563682f62616467652f6d696e657275)](https://pepy.tech/project/mineru)[![Downloads](https://camo.githubusercontent.com/791dafe0b60ab2fba372c295ee127ba891deeddbd59bcf264d971a52e9d18b52/68747470733a2f2f7374617469632e706570792e746563682f62616467652f6d696e6572752f6d6f6e7468)](https://pepy.tech/project/mineru)[![OpenDataLab](https://camo.githubusercontent.com/afffec322e28672cd438b1aee4f210450d2123cb23fc3e28cdb6c3b3bf5ad287/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f7765626170705f6f6e5f6d696e6572752e6e65742d626c75653f6c6f676f3d646174613a696d6167652f7376672b786d6c3b6261736536342c50484e325a79423361575230614430694d544d304969426f5a576c6e61485139496a457a4e43496765473173626e4d39496d6830644841364c79393364336375647a4d7562334a6e4c7a49774d44417663335a6e496a3438634746306143426b50534a744d5449794c446c6a4d4377314c5451734f5330354c446c7a4c546b744e4330354c546b734e4330354c446b744f5377354c4451734f537735656949675a6d6c736244306964584a734b434e684b534976506a78775958526f49475139496d30784d6a49734f574d774c4455744e4377354c546b734f584d744f5330304c546b744f5377304c546b734f5330354c446b734e4377354c446c364969426d615778735053496a4d4445774d5441784969382b50484268644767675a44306962546b784c444534597a41734e5330304c446b744f537735637930354c5451744f5330354c4451744f5377354c546b734f5377304c446b734f586f6949475a7062477739496e56796243676a59696b694c7a3438634746306143426b50534a744f5445734d54686a4d4377314c5451734f5330354c446c7a4c546b744e4330354c546b734e4330354c446b744f5377354c4451734f537735656949675a6d6c7362443069497a41784d4445774d534976506a78775958526f49475a7062477774636e56735a5430695a585a6c626d396b5a43496759327870634331796457786c50534a6c646d56756232526b4969426b50534a744d7a6b734e6a4a6a4d4377784e6977344c444d774c4449774c444d344c4463744e6977784d6930784e6977784d6930794e6c59304f574d774c5451734d7930334c4459744f4777304e6930784d6d4d314c5445734d5445734d7977784d537734646a4d78597a41734d7a63744d7a41734e6a59744e6a59734e6a59744d7a63734d4330324e69307a4d4330324e6930324e6c59304e6d4d774c5451734d7930334c4459744f4777794d433032597a55744d5377784d53777a4c4445784c4468324d6a4636625330794f537732597a41734d5459734e69777a4d4377784e7977304d43777a4c4445734e5377784c4467734d5377314c4441734d5441744d5377784e53307a517a4d334c446b314c4449354c4463354c4449354c445979566a5179624330784f537731646a4977656949675a6d6c736244306964584a734b434e6a4b534976506a78775958526f49475a7062477774636e56735a5430695a585a6c626d396b5a43496759327870634331796457786c50534a6c646d56756232526b4969426b50534a744d7a6b734e6a4a6a4d4377784e6977344c444d774c4449774c444d344c4463744e6977784d6930784e6977784d6930794e6c59304f574d774c5451734d7930334c4459744f4777304e6930784d6d4d314c5445734d5445734d7977784d537734646a4d78597a41734d7a63744d7a41734e6a59744e6a59734e6a59744d7a63734d4330324e69307a4d4330324e6930324e6c59304e6d4d774c5451734d7930334c4459744f4777794d433032597a55744d5377784d53777a4c4445784c4468324d6a4636625330794f537732597a41734d5459734e69777a4d4377784e7977304d43777a4c4445734e5377784c4467734d5377314c4441734d5441744d5377784e53307a517a4d334c446b314c4449354c4463354c4449354c445979566a5179624330784f537731646a4977656949675a6d6c7362443069497a41784d4445774d534976506a786b5a575a7a506a78736157356c59584a48636d466b61575675644342705a4430695953496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a78736157356c59584a48636d466b61575675644342705a4430695969496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a78736157356c59584a48636d466b61575675644342705a4430695979496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a77765a47566d637a34384c334e325a7a343d266c6162656c436f6c6f723d7768697465)](https://mineru.net/OpenSourceTools/Extractor?source=github)[![HuggingFace](https://camo.githubusercontent.com/7dfca7e1d8709395d5b4c92a2f9008f678e7dd8c2b6d01550976be0282f063ef/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f44656d6f5f6f6e5f48756767696e67466163652d79656c6c6f772e7376673f6c6f676f3d646174613a696d6167652f706e673b6261736536342c6956424f5277304b47676f414141414e5355684555674141414638414141425943414d414141436b6c39742f414141416b31424d5645564863457a2f6e51762f6e51762f6e51722f6e51762f6e51722f6e51762f6e51762f6e51722f7752662f7478542f7067372f7952722f7242442f7a527a2f6e67762f6f417a2f7a687a2f6e77762f7478542f6e67762f3042332b7a427a2f6e51762f3068372f77786e2f7652622f7468586b7569542f7278482f7078442f6f677a637179662f6e5176546c537a2f637a43786b79372f536a6966646a542f4d6a332b4d6a33774d6a313561546e444e7a2b445344395254554273503046524f3051364f305779497845494141414147485253546c4d414442387a535746336b7244447738544a314e625835656676386666392f66784b444a3975414141474b6b6c45515652343275325a3633716a4f41794743345277434f6642324a41477172536232576e54772f316633556157635347594e4b5464662f502b6d4f6b5472452b794a42756c7666764c543241357275656e61564879496b7333336e706c2f364334732f5a4c414d3435534f692f3146745a5079467572314f596f66425833773764353442786d2b453864622b6e4472313274746d45535a347a6c75644a4547355337544f373259506c4b5a4679452b594359554a54425a734d694e53355364374e6c446d4b4d324567324a516738617762676c667167626841726a786b533764677032524836686339414d4c645a5955745a4e35444a72346d6f6c433842664b72456b504b456e45566a4c62675731664c7937375a564f4a61676f49634c496c2b497861515a476a6958353937486f704635436b6158564d444f395079697833414656336b77346c514c436248754d6f767a3846616c6c626351494a35546130766b7339526e6f6c62434b383442746a4b5253357541343368596f5a634f424749473245706276364376465651386d386c6f683636574e7953736e4e3768744c35384c4e702b4e5854382f506858694258504d6a4c5378747770385739662f31416e6752696572426b412b6b6b2f497055534f654b42797a6e3879336b41414166682f2f306f58675634726f486d2f6b7a3445327a2f2f7a5263332f6c6777427a624d326d4a7851456135707167583764314c306874726878374c4b784f5a6c4b627763415779454f577159534938595074674451566a7042356e76614861536e426151534436687765446938506f737844362f50543039595933785141374c5443544b6659582b5148704130474363716d454876722f6379664b5154457577676273326b50784a454230694e6a664a63435450796f63782b413067726948536d4144694339316f4e4756774a363952756459653635764a6d6f716670756c306c727158616457306a464b4835424b77416543712b44656e37732b337a66524a7a4136312f556a2f39482f567a4c4b5478396a46505064586565502b4c37574576444c414b41496f46386250544b54302b544d37573865506a33527a2f596e336b4f41703266314b663057656f6e7937706e2f6350796476685159562b65464f666d4f753756422f5669506533342f454e33524648592f7952755438646443744d50482f4d6342415435732b765264652f676632632f7350736a4c4b2b6d354942514635744f2b683274546c42476e50363639334a6473766f666a4f506e6e45486b6832546e562f583166426c3953357a7277757746384e467241564a567743415054653867614a6c6f6d716c7030707634506a6e3938744a2f742f664c2b2b36756e705231594743326e2f4b436f613074544c6f4b6945655550446c39346e6a2b352f5476332f6554357642513630583153306f5a722b49575252384c64687537416c4c6a5049536c4a634f397672466f746b793953707a446571756c7745697235626559416330523744394b533144587661306a68595244586f4578506463367977354753686b5a58653951644f2f754f76486f66786a72562f544e5336694d4a532b3454635354676b396e3561674a64425162422f2f4966462f48707650743354626937623649364b305237327036616a7279454a72454e57326262655655476a66676f616c73344c3434336337424545346d4a4f32537062526e67785172414b527564527a4751386a564f4c327144566a6a49384b3167633354494a354b69465a31712b67647341525042344e515334416a77565374373244536f584e794f57557255356d51396e5259796a703839586f376f52493642676139514e54316d512f7074614a7135542f37576367415a7977522f586c5047415544646574334c452b71533054492b672b614a55384d49716a6f304b78384c792b6d61784c6a4a6d6a51313872413059436b784c5162555a50315771646d7951474a4c556d37566e5146716f646d5853716d527264567071647a6b354c766d76677445635738504d476461533233454f577944566241435a7a554a5061714d626a44787041335172676c3041696b696d474462716d79543850384e4f596971726c64463872582b594e37546f705834556f4875534359593763675834674877636c514b6c317a6878305448662b7443415556616c7a6a493757673945687074726b496366494a6a41393465764f6e384232654861567a7642726e6c32696730536f36687650617a304947634f7654487655496c45322b70727141784c5351785a6c55327374716c314e7143434c644969494e2f693144424548556f456c4d3964427261766269416e4b716770693449426b772b75745350496f42696a44584a6970535656374d704f454a55416335516d6d33426e554e2b7733687465456965594b66525a53495563584b4d5666307535774434457773554e56765a4f745554374132476b6666486a42795770487176524259725456373261366a387a5a3657304454453836486e3034626d795758335269395748375a55365137682b5a486f306e4855416373517656685852445a484368776979692f686e50754f735345463645786b336f365939445431655a2b36634153586b3259396b2b36454f514d44476d3657424b3130774f514a43427772656e383663505057556352416e54566a476355314c4267733946555269582f6536343739795a634c7743426d54786961774577724f636c6575753132743374624c762f4e34524c594942685965786d3746636e344f4a636e302b7a632b73382f5666506564645a4841474e365454386547637a4864522f477473312f4d7a446b54687232337a71725666414d465433334e7831524a7378316b357a7557494c4c6e472f7673482b46763544344e5456637031477a6f384141414141456c46546b5375516d4343266c6162656c436f6c6f723d7768697465)](https://huggingface.co/spaces/opendatalab/MinerU)[![ModelScope](https://camo.githubusercontent.com/733f6a03b861d1c5d9f9216122a60111c8b92368793df4b37e648c0e61288868/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f44656d6f5f6f6e5f4d6f64656c53636f70652d707572706c653f6c6f676f3d646174613a696d6167652f7376672b786d6c3b6261736536342c50484e325a79423361575230614430694d6a497a4969426f5a576c6e61485139496a49774d43496765473173626e4d39496d6830644841364c79393364336375647a4d7562334a6e4c7a49774d44417663335a6e496a344b436941385a7a344b4943413864476c306247552b544746355a5849674d54777664476c306247552b43694167504842686447676761575139496e4e325a3138784e4349675a6d6c7362443069497a59794e47466d5a6949675a443069625441734f446b754f4452734d6a55754e6a55734d4777774c4449314c6a59304f546b35624330794e5334324e537777624441734c5449314c6a59304f546b356569497650676f67494478775958526f49476c6b50534a7a646d64664d54556949475a706247773949694d324d6a52685a6d596949475139496d30354f5334784e4377784d5455754e446c734d6a55754e6a55734d4777774c4449314c6a5931624330794e5334324e537777624441734c5449314c6a59316569497650676f67494478775958526f49476c6b50534a7a646d64664d54596949475a706247773949694d324d6a52685a6d596949475139496d30784e7a59754d446b734d5451784c6a4530624330794e5334324e446b354f537777624441734d6a49754d546c734e4463754f4451734d4777774c4330304e7934344e4777744d6a49754d546b734d4777774c4449314c6a59316569497650676f67494478775958526f49476c6b50534a7a646d64664d54636949475a706247773949694d7a4e6d4e6d5a44456949475139496d30784d6a51754e7a6b734f446b754f4452734d6a55754e6a55734d4777774c4449314c6a59304f546b35624330794e5334324e537777624441734c5449314c6a59304f546b356569497650676f67494478775958526f49476c6b50534a7a646d64664d54676949475a706247773949694d7a4e6d4e6d5a44456949475139496d30774c4459304c6a4535624449314c6a59314c4442734d4377794e5334324e5777744d6a55754e6a55734d4777774c4330794e5334324e586f694c7a344b4943413863474630614342705a44306963335a6e587a45354969426d615778735053496a4e6a493059575a6d4969426b50534a744d546b344c6a49344c4467354c6a6730624449314c6a59304f546b354c4442734d4377794e5334324e446b354f5777744d6a55754e6a51354f546b734d4777774c4330794e5334324e446b354f586f694c7a344b4943413863474630614342705a44306963335a6e587a49774969426d615778735053496a4d7a5a6a5a6d51784969426b50534a744d546b344c6a49344c4459304c6a4535624449314c6a59304f546b354c4442734d4377794e5334324e5777744d6a55754e6a51354f546b734d4777774c4330794e5334324e586f694c7a344b4943413863474630614342705a44306963335a6e587a49784969426d615778735053496a4e6a493059575a6d4969426b50534a744d5455774c6a51304c445179624441734d6a49754d546c734d6a55754e6a51354f546b734d4777774c4449314c6a5931624449794c6a45354c4442734d4377744e4463754f4452734c5451334c6a67304c4442364969382b43694167504842686447676761575139496e4e325a3138794d6949675a6d6c7362443069497a4d3259325a6b4d5349675a4430696254637a4c6a51354c4467354c6a6730624449314c6a59314c4442734d4377794e5334324e446b354f5777744d6a55754e6a55734d4777774c4330794e5334324e446b354f586f694c7a344b4943413863474630614342705a44306963335a6e587a497a4969426d615778735053496a4e6a493059575a6d4969426b50534a744e4463754f4451734e6a51754d546c734d6a55754e6a55734d4777774c4330794d6934784f5777744e4463754f4451734d4777774c4451334c6a6730624449794c6a45354c4442734d4377744d6a55754e6a56364969382b43694167504842686447676761575139496e4e325a3138794e4349675a6d6c7362443069497a59794e47466d5a6949675a443069625451334c6a67304c4445784e5334304f5777744d6a49754d546b734d4777774c4451334c6a6730624451334c6a67304c4442734d4377744d6a49754d546c734c5449314c6a59314c4442734d4377744d6a55754e6a56364969382b436941384c32632b436a777663335a6e50673d3d266c6162656c436f6c6f723d7768697465)](https://www.modelscope.cn/studios/OpenDataLab/MinerU)[![Colab](https://camo.githubusercontent.com/eff96fda6b2e0fff8cdf2978f89d61aa434bb98c00453ae23dd0aab8d1451633/68747470733a2f2f636f6c61622e72657365617263682e676f6f676c652e636f6d2f6173736574732f636f6c61622d62616467652e737667)](https://colab.research.google.com/gist/myhloli/a3cb16570ab3cfeadf9d8f0ac91b4fca/mineru_demo.ipynb)[![arXiv](https://camo.githubusercontent.com/49051f1b821e0de837384e50f2b456ddd3cc85af8ffd14362ead863988487f0f/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4d696e6572552d546563686e6963616c2532305265706f72742d6233316231622e7376673f6c6f676f3d6172586976)](https://arxiv.org/abs/2409.18839)[![arXiv](https://camo.githubusercontent.com/dcd82eba7732bfe20adfa845c55138eed0db54368d2880681f325d6825f99aa3/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4d696e657255322e352d546563686e6963616c2532305265706f72742d6233316231622e7376673f6c6f676f3d6172586976)](https://arxiv.org/abs/2509.22186)[![Ask DeepWiki](https://camo.githubusercontent.com/0f5ae213ac378635adeb5d7f13cef055ad2f7d9a47b36de7b1c67dbe09f609ca/68747470733a2f2f6465657077696b692e636f6d2f62616467652e737667)](https://deepwiki.com/opendatalab/MinerU)

[![opendatalab%2FMinerU | Trendshift](https://camo.githubusercontent.com/8e05ac968e83dbb8fbd1ff02a16b03186a2d01c3a19db633923afceebfdfe4aa/68747470733a2f2f7472656e6473686966742e696f2f6170692f62616467652f7265706f7369746f726965732f3131313734)](https://trendshift.io/repositories/11174)

[English](https://github.com/opendatalab/MinerU/blob/master/README.md) \| [简体中文](https://github.com/opendatalab/MinerU/blob/master/README_zh-CN.md)

🚀 [Access MinerU Now→✅ Zero-Install Web Version ✅ Full-Featured Desktop Client ✅ Instant API Access; Skip deployment headaches – get all product formats in one click. Developers, dive in!](https://mineru.net/?source=github)

👋 join us on [Discord](https://discord.gg/Tdedn9GTXq) and [WeChat](https://mineru.net/community-portal/?aliasId=3c430f94)

# Changelog

[Permalink: Changelog](https://github.com/opendatalab/MinerU/blob/master/README.md#changelog)

- 2025/12/02 2.6.6 Release
  - `mineru-api` tool optimizations

    - Added descriptive text to `mineru-api` interface parameters to improve API documentation readability.
    - You can use the environment variable `MINERU_API_ENABLE_FASTAPI_DOCS` to control whether the auto-generated interface documentation page is enabled (enabled by default).
    - Added concurrency configuration options for the `vlm-vllm-async-engine`, `vlm-lmdeploy-engine`, and `vlm-http-client` backends. Users can use the environment variable `MINERU_API_MAX_CONCURRENT_REQUESTS` to set the maximum number of concurrent API requests (unlimited by default).
- 2025/11/26 2.6.5 Release
  - Added support for a new backend vlm-lmdeploy-engine. Its usage is similar to vlm-vllm-(async)engine, but it uses lmdeploy as the inference engine and additionally supports native inference acceleration on Windows platforms compared to vllm.
- 2025/11/04 2.6.4 Release
  - Added timeout configuration for PDF image rendering, default is 300 seconds, can be configured via environment variable `MINERU_PDF_RENDER_TIMEOUT` to prevent long blocking of the rendering process caused by some abnormal PDF files.
  - Added CPU thread count configuration options for ONNX models, default is the system CPU core count, can be configured via environment variables `MINERU_INTRA_OP_NUM_THREADS` and `MINERU_INTER_OP_NUM_THREADS` to reduce CPU resource contention conflicts in high concurrency scenarios.
- 2025/10/31 2.6.3 Release
  - Added support for a new backend `vlm-mlx-engine`, enabling MLX-accelerated inference for the MinerU2.5 model on Apple Silicon devices. Compared to the `vlm-transformers` backend, `vlm-mlx-engine` delivers a 100%–200% speed improvement.
  - Bug fixes: #3849, #3859
- 2025/10/24 2.6.2 Release
  - `pipeline` backend optimizations

    - Added experimental support for Chinese formulas, which can be enabled by setting the environment variable `export MINERU_FORMULA_CH_SUPPORT=1`. This feature may cause a slight decrease in MFR speed and failures in recognizing some long formulas. It is recommended to enable it only when parsing Chinese formulas is needed. To disable this feature, set the environment variable to `0`.
    - `OCR` speed significantly improved by 200%~300%, thanks to the optimization solution provided by [@cjsdurj](https://github.com/cjsdurj)
    - `OCR` models optimized for improved accuracy and coverage of Latin script recognition, and updated Cyrillic, Arabic, Devanagari, Telugu (te), and Tamil (ta) language systems to `ppocr-v5` version, with accuracy improved by over 40% compared to previous models
  - `vlm` backend optimizations

    - `table_caption` and `table_footnote` matching logic optimized to improve the accuracy of table caption and footnote matching and reading order rationality in scenarios with multiple consecutive tables on a page
    - Optimized CPU resource usage during high concurrency when using `vllm` backend, reducing server pressure
    - Adapted to `vllm` version 0.11.0
  - General optimizations
    - Cross-page table merging effect optimized, added support for cross-page continuation table merging, improving table merging effectiveness in multi-column merge scenarios
    - Added environment variable configuration option `MINERU_TABLE_MERGE_ENABLE` for table merging feature. Table merging is enabled by default and can be disabled by setting this variable to `0`
- 2025/09/26 2.5.4 released
  - 🎉🎉 The MinerU2.5 [Technical Report](https://arxiv.org/abs/2509.22186) is now available! We welcome you to read it for a comprehensive overview of its model architecture, training strategy, data engineering and evaluation results.
  - Fixed an issue where some `PDF` files were mistakenly identified as `AI` files, causing parsing failures
- 2025/09/20 2.5.3 Released
  - Dependency version range adjustment to enable Turing and earlier architecture GPUs to use vLLM acceleration for MinerU2.5 model inference.
  - `pipeline` backend compatibility fixes for torch 2.8.0.
  - Reduced default concurrency for vLLM async backend to lower server pressure and avoid connection closure issues caused by high load.
  - More compatibility-related details can be found in the [announcement](https://github.com/opendatalab/MinerU/discussions/3548)
- 2025/09/19 2.5.2 Released

We are officially releasing MinerU2.5, currently the most powerful multimodal large model for document parsing.
With only 1.2B parameters, MinerU2.5's accuracy on the OmniDocBench benchmark comprehensively surpasses top-tier multimodal models like Gemini 2.5 Pro, GPT-4o, and Qwen2.5-VL-72B. It also significantly outperforms leading specialized models such as dots.ocr, MonkeyOCR, and PP-StructureV3.
The model has been released on [HuggingFace](https://huggingface.co/opendatalab/MinerU2.5-2509-1.2B) and [ModelScope](https://modelscope.cn/models/opendatalab/MinerU2.5-2509-1.2B) platforms. Welcome to download and use!


  - Core Highlights:
    - SOTA Performance with Extreme Efficiency: As a 1.2B model, it achieves State-of-the-Art (SOTA) results that exceed models in the 10B and 100B+ classes, redefining the performance-per-parameter standard in document AI.
    - Advanced Architecture for Across-the-Board Leadership: By combining a two-stage inference pipeline (decoupling layout analysis from content recognition) with a native high-resolution architecture, it achieves SOTA performance across five key areas: layout analysis, text recognition, formula recognition, table recognition, and reading order.
  - Key Capability Enhancements:
    - Layout Detection: Delivers more complete results by accurately covering non-body content like headers, footers, and page numbers. It also provides more precise element localization and natural format reconstruction for lists and references.
    - Table Parsing: Drastically improves parsing for challenging cases, including rotated tables, borderless/semi-structured tables, and long/complex tables.
    - Formula Recognition: Significantly boosts accuracy for complex, long-form, and hybrid Chinese-English formulas, greatly enhancing the parsing capability for mathematical documents.

Additionally, with the release of vlm 2.5, we have made some adjustments to the repository:

  - The vlm backend has been upgraded to version 2.5, supporting the MinerU2.5 model and no longer compatible with the MinerU2.0-2505-0.9B model. The last version supporting the 2.0 model is mineru-2.2.2.
  - VLM inference-related code has been moved to [mineru\_vl\_utils](https://github.com/opendatalab/mineru-vl-utils), reducing coupling with the main mineru repository and facilitating independent iteration in the future.
  - The vlm accelerated inference framework has been switched from `sglang` to `vllm`, achieving full compatibility with the vllm ecosystem, allowing users to use the MinerU2.5 model and accelerated inference on any platform that supports the vllm framework.
  - Due to major upgrades in the vlm model supporting more layout types, we have made some adjustments to the structure of the parsing intermediate file `middle.json` and result file `content_list.json`. Please refer to the [documentation](https://opendatalab.github.io/MinerU/reference/output_files/) for details.

Other repository optimizations:
  - Removed file extension whitelist validation for input files. When input files are PDF documents or images, there are no longer requirements for file extensions, improving usability.

History Log2025/09/10 2.2.2 Released

- Fixed the issue where the new table recognition model would affect the overall parsing task when some table parsing failed

2025/09/08 2.2.1 Released

- Fixed the issue where some newly added models were not downloaded when using the model download command.

2025/09/05 2.2.0 Released

- Major Updates
  - In this version, we focused on improving table parsing accuracy by introducing a new [wired table recognition model](https://github.com/RapidAI/TableStructureRec) and a brand-new hybrid table structure parsing algorithm, significantly enhancing the table recognition capabilities of the `pipeline` backend.
  - We also added support for cross-page table merging, which is supported by both `pipeline` and `vlm` backends, further improving the completeness and accuracy of table parsing.
- Other Updates
  - The `pipeline` backend now supports 270-degree rotated table parsing, bringing support for table parsing in 0/90/270-degree orientations
  - `pipeline` added OCR capability support for Thai and Greek, and updated the English OCR model to the latest version. English recognition accuracy improved by 11%, Thai recognition model accuracy is 82.68%, and Greek recognition model accuracy is 89.28% (by PPOCRv5)
  - Added `bbox` field (mapped to 0-1000 range) in the output `content_list.json`, making it convenient for users to directly obtain position information for each content block
  - Removed the `pipeline_old_linux` installation option, no longer supporting legacy Linux systems such as `CentOS 7`, to provide better support for `uv`'s `sync`/`run` commands

2025/08/01 2.1.10 Released

- Fixed an issue in the `pipeline` backend where block overlap caused the parsing results to deviate from expectations #3232

2025/07/30 2.1.9 Released

- `transformers` 4.54.1 version adaptation

2025/07/28 2.1.8 Released

- `sglang` 0.4.9.post5 version adaptation

2025/07/27 2.1.7 Released

- `transformers` 4.54.0 version adaptation

2025/07/26 2.1.6 Released

- Fixed table parsing issues in handwritten documents when using `vlm` backend
- Fixed visualization box position drift issue when document is rotated #3175

2025/07/24 2.1.5 Released

- `sglang` 0.4.9 version adaptation, synchronously upgrading the dockerfile base image to sglang 0.4.9.post3

2025/07/23 2.1.4 Released

- **Bug Fixes**
  - Fixed the issue of excessive memory consumption during the `MFR` step in the `pipeline` backend under certain scenarios #2771
  - Fixed the inaccurate matching between `image`/`table` and `caption`/`footnote` under certain conditions #3129

2025/07/16 2.1.1 Released

- **Bug fixes**
  - Fixed text block content loss issue that could occur in certain `pipeline` scenarios #3005
  - Fixed issue where `sglang-client` required unnecessary packages like `torch` #2968
  - Updated `dockerfile` to fix incomplete text content parsing due to missing fonts in Linux #2915
- **Usability improvements**
  - Updated `compose.yaml` to facilitate direct startup of `sglang-server`, `mineru-api`, and `mineru-gradio` services
  - Launched brand new [online documentation site](https://opendatalab.github.io/MinerU/), simplified readme, providing better documentation experience

2025/07/05 2.1.0 Released

- This is the first major update of MinerU 2, which includes a large number of new features and improvements, covering significant performance optimizations, user experience enhancements, and bug fixes. The detailed update contents are as follows:
- **Performance Optimizations:**
  - Significantly improved preprocessing speed for documents with specific resolutions (around 2000 pixels on the long side).
  - Greatly enhanced post-processing speed when the `pipeline` backend handles batch processing of documents with fewer pages (<10 pages).
  - Layout analysis speed of the `pipeline` backend has been increased by approximately 20%.
- **Experience Enhancements:**
  - Built-in ready-to-use `fastapi service` and `gradio webui`. For detailed usage instructions, please refer to [Documentation](https://opendatalab.github.io/MinerU/usage/quick_usage/#advanced-usage-via-api-webui-sglang-clientserver).
  - Adapted to `sglang` version `0.4.8`, significantly reducing the GPU memory requirements for the `vlm-sglang` backend. It can now run on graphics cards with as little as `8GB GPU memory` (Turing architecture or newer).
  - Added transparent parameter passing for all commands related to `sglang`, allowing the `sglang-engine` backend to receive all `sglang` parameters consistently with the `sglang-server`.
  - Supports feature extensions based on configuration files, including `custom formula delimiters`, `enabling heading classification`, and `customizing local model directories`. For detailed usage instructions, please refer to [Documentation](https://opendatalab.github.io/MinerU/usage/quick_usage/#extending-mineru-functionality-with-configuration-files).
- **New Features:**
  - Updated the `pipeline` backend with the PP-OCRv5 multilingual text recognition model, supporting text recognition in 37 languages such as French, Spanish, Portuguese, Russian, and Korean, with an average accuracy improvement of over 30%. [Details](https://paddlepaddle.github.io/PaddleOCR/latest/en/version3.x/algorithm/PP-OCRv5/PP-OCRv5_multi_languages.html)
  - Introduced limited support for vertical text layout in the `pipeline` backend.

2025/06/20 2.0.6 Released

- Fixed occasional parsing interruptions caused by invalid block content in `vlm` mode
- Fixed parsing interruptions caused by incomplete table structures in `vlm` mode

2025/06/17 2.0.5 Released

- Fixed the issue where models were still required to be downloaded in the `sglang-client` mode
- Fixed the issue where the `sglang-client` mode unnecessarily depended on packages like `torch` during runtime.
- Fixed the issue where only the first instance would take effect when attempting to launch multiple `sglang-client` instances via multiple URLs within the same process

2025/06/15 2.0.3 released

- Fixed a configuration file key-value update error that occurred when downloading model type was set to `all`
- Fixed the issue where the formula and table feature toggle switches were not working in `command line mode`, causing the features to remain enabled.
- Fixed compatibility issues with sglang version 0.4.7 in the `sglang-engine` mode.
- Updated Dockerfile and installation documentation for deploying the full version of MinerU in sglang environment

2025/06/13 2.0.0 Released

- **New Architecture**: MinerU 2.0 has been deeply restructured in code organization and interaction methods, significantly improving system usability, maintainability, and extensibility.

  - **Removal of Third-party Dependency Limitations**: Completely eliminated the dependency on `pymupdf`, moving the project toward a more open and compliant open-source direction.
  - **Ready-to-use, Easy Configuration**: No need to manually edit JSON configuration files; most parameters can now be set directly via command line or API.
  - **Automatic Model Management**: Added automatic model download and update mechanisms, allowing users to complete model deployment without manual intervention.
  - **Offline Deployment Friendly**: Provides built-in model download commands, supporting deployment requirements in completely offline environments.
  - **Streamlined Code Structure**: Removed thousands of lines of redundant code, simplified class inheritance logic, significantly improving code readability and development efficiency.
  - **Unified Intermediate Format Output**: Adopted standardized `middle_json` format, compatible with most secondary development scenarios based on this format, ensuring seamless ecosystem business migration.
- **New Model**: MinerU 2.0 integrates our latest small-parameter, high-performance multimodal document parsing model, achieving end-to-end high-speed, high-precision document understanding.

  - **Small Model, Big Capabilities**: With parameters under 1B, yet surpassing traditional 72B-level vision-language models (VLMs) in parsing accuracy.
  - **Multiple Functions in One**: A single model covers multilingual recognition, handwriting recognition, layout analysis, table parsing, formula recognition, reading order sorting, and other core tasks.
  - **Ultimate Inference Speed**: Achieves peak throughput exceeding 10,000 tokens/s through `sglang` acceleration on a single NVIDIA 4090 card, easily handling large-scale document processing requirements.
  - **Online Experience**: You can experience our brand-new VLM model on [MinerU.net](https://mineru.net/OpenSourceTools/Extractor), [Hugging Face](https://huggingface.co/spaces/opendatalab/MinerU), and [ModelScope](https://www.modelscope.cn/studios/OpenDataLab/MinerU).
- **Incompatible Changes Notice**: To improve overall architectural rationality and long-term maintainability, this version contains some incompatible changes:

  - Python package name changed from `magic-pdf` to `mineru`, and the command-line tool changed from `magic-pdf` to `mineru`. Please update your scripts and command calls accordingly.
  - For modular system design and ecosystem consistency considerations, MinerU 2.0 no longer includes the LibreOffice document conversion module. If you need to process Office documents, we recommend converting them to PDF format through an independently deployed LibreOffice service before proceeding with subsequent parsing operations.

2025/05/24 Release 1.3.12

- Added support for PPOCRv5 models, updated `ch_server` model to `PP-OCRv5_rec_server`, and `ch_lite` model to `PP-OCRv5_rec_mobile` (model update required)

  - In testing, we found that PPOCRv5(server) has some improvement for handwritten documents, but has slightly lower accuracy than v4\_server\_doc for other document types, so the default ch model remains unchanged as `PP-OCRv4_server_rec_doc`.
  - Since PPOCRv5 has enhanced recognition capabilities for handwriting and special characters, you can manually choose the PPOCRv5 model for Japanese-Traditional Chinese mixed scenarios and handwritten documents
  - You can select the appropriate model through the lang parameter `lang='ch_server'` (Python API) or `--lang ch_server` (command line):

    - `ch`: `PP-OCRv4_server_rec_doc` (default) (Chinese/English/Japanese/Traditional Chinese mixed/15K dictionary)
    - `ch_server`: `PP-OCRv5_rec_server` (Chinese/English/Japanese/Traditional Chinese mixed + handwriting/18K dictionary)
    - `ch_lite`: `PP-OCRv5_rec_mobile` (Chinese/English/Japanese/Traditional Chinese mixed + handwriting/18K dictionary)
    - `ch_server_v4`: `PP-OCRv4_rec_server` (Chinese/English mixed/6K dictionary)
    - `ch_lite_v4`: `PP-OCRv4_rec_mobile` (Chinese/English mixed/6K dictionary)
- Added support for handwritten documents through optimized layout recognition of handwritten text areas
  - This feature is supported by default, no additional configuration required
  - You can refer to the instructions above to manually select the PPOCRv5 model for better handwritten document parsing results
- The `huggingface` and `modelscope` demos have been updated to versions that support handwriting recognition and PPOCRv5 models, which you can experience online

2025/04/29 Release 1.3.10

- Added support for custom formula delimiters, which can be configured by modifying the `latex-delimiter-config` section in the `magic-pdf.json` file in your user directory.

2025/04/27 Release 1.3.9

- Optimized formula parsing functionality, improved formula rendering success rate

2025/04/23 Release 1.3.8

- The default `ocr` model (`ch`) has been updated to `PP-OCRv4_server_rec_doc` (model update required)

  - `PP-OCRv4_server_rec_doc` is trained on a mixture of more Chinese document data and PP-OCR training data based on `PP-OCRv4_server_rec`, adding recognition capabilities for some traditional Chinese characters, Japanese, and special characters. It can recognize over 15,000 characters and improves both document-specific and general text recognition abilities.
  - [Performance comparison of PP-OCRv4\_server\_rec\_doc/PP-OCRv4\_server\_rec/PP-OCRv4\_mobile\_rec](https://paddlepaddle.github.io/PaddleX/latest/module_usage/tutorials/ocr_modules/text_recognition.html#_3)
  - After verification, the `PP-OCRv4_server_rec_doc` model shows significant accuracy improvements in Chinese/English/Japanese/Traditional Chinese in both single language and mixed language scenarios, with comparable speed to `PP-OCRv4_server_rec`, making it suitable for most use cases.
  - In some pure English scenarios, `PP-OCRv4_server_rec_doc` may have word adhesion issues, while `PP-OCRv4_server_rec` performs better in these cases. Therefore, we've kept the `PP-OCRv4_server_rec` model, which users can access by adding the parameter `lang='ch_server'` (Python API) or `--lang ch_server` (command line).

2025/04/22 Release 1.3.7

- Fixed the issue where the lang parameter was ineffective during table parsing model initialization
- Fixed the significant speed reduction of OCR and table parsing in `cpu` mode

2025/04/16 Release 1.3.4

- Slightly improved OCR-det speed by removing some unnecessary blocks
- Fixed page-internal sorting errors caused by footnotes in certain cases

2025/04/12 Release 1.3.2

- Fixed dependency version incompatibility issues when installing on Windows with Python 3.13
- Optimized memory usage during batch inference
- Improved parsing of tables rotated 90 degrees
- Enhanced parsing of oversized tables in financial report samples
- Fixed the occasional word adhesion issue in English text areas when OCR language is not specified (model update required)

2025/04/08 Release 1.3.1

- Fixed several compatibility issues
  - Added support for Python 3.13
  - Made final adaptations for outdated Linux systems (such as CentOS 7) with no guarantee of continued support in future versions, [installation instructions](https://github.com/opendatalab/MinerU/issues/1004)

2025/04/03 Release 1.3.0

- Installation and compatibility optimizations
  - Resolved compatibility issues caused by `detectron2` by removing `layoutlmv3` usage in layout
  - Extended torch version compatibility to 2.2~2.6 (excluding 2.5)
  - Added CUDA compatibility for versions 11.8/12.4/12.6/12.8 (CUDA version determined by torch), solving compatibility issues for users with 50-series and H-series GPUs
  - Extended Python compatibility to versions 3.10~3.12, fixing the issue of automatic downgrade to version 0.6.1 when installing in non-3.10 environments
  - Optimized offline deployment process, eliminating the need to download any model files after successful deployment
- Performance optimizations
  - Enhanced parsing speed for batches of small files by supporting batch processing of multiple PDF files ( [script example](https://github.com/opendatalab/MinerU/blob/master/demo/batch_demo.py)), with formula parsing speed improved by up to 1400% and overall parsing speed improved by up to 500% compared to version 1.0.1
  - Reduced memory usage and improved parsing speed by optimizing MFR model loading and usage (requires re-running the [model download process](https://github.com/opendatalab/MinerU/blob/master/docs/how_to_download_models_zh_cn.md) to get incremental updates to model files)
  - Optimized GPU memory usage, requiring only 6GB minimum to run this project
  - Improved running speed on MPS devices
- Parsing effect optimizations
  - Updated MFR model to `unimernet(2503)`, fixing line break loss issues in multi-line formulas
- Usability optimizations
  - Completely replaced the `paddle` framework and `paddleocr` in the project by using `paddleocr2torch`, resolving conflicts between `paddle` and `torch`, as well as thread safety issues caused by the `paddle` framework
  - Added real-time progress bar display during parsing, allowing precise tracking of parsing progress and making the waiting process more bearable

2025/03/03 1.2.1 released

- Fixed the impact on punctuation marks during full-width to half-width conversion of letters and numbers
- Fixed caption matching inaccuracies in certain scenarios
- Fixed formula span loss issues in certain scenarios

2025/02/24 1.2.0 released

This version includes several fixes and improvements to enhance parsing efficiency and accuracy:

- **Performance Optimization**
  - Increased classification speed for PDF documents in auto mode.
- **Parsing Optimization**
  - Improved parsing logic for documents containing watermarks, significantly enhancing the parsing results for such documents.
  - Enhanced the matching logic for multiple images/tables and captions within a single page, improving the accuracy of image-text matching in complex layouts.
- **Bug Fixes**
  - Fixed an issue where image/table spans were incorrectly filled into text blocks under certain conditions.
  - Resolved an issue where title blocks were empty in some cases.

2025/01/22 1.1.0 released

In this version we have focused on improving parsing accuracy and efficiency:

- **Model capability upgrade** (requires re-executing the [model download process](https://github.com/opendatalab/MinerU/blob/master/docs/how_to_download_models_en.md) to obtain incremental updates of model files)

  - The layout recognition model has been upgraded to the latest `doclayout_yolo(2501)` model, improving layout recognition accuracy.
  - The formula parsing model has been upgraded to the latest `unimernet(2501)` model, improving formula recognition accuracy.
- **Performance optimization**
  - On devices that meet certain configuration requirements (16GB+ VRAM), by optimizing resource usage and restructuring the processing pipeline, overall parsing speed has been increased by more than 50%.
- **Parsing effect optimization**
  - Added a new heading classification feature (testing version, enabled by default) to the online demo ( [mineru.net](https://mineru.net/OpenSourceTools/Extractor)/ [huggingface](https://huggingface.co/spaces/opendatalab/MinerU)/ [modelscope](https://www.modelscope.cn/studios/OpenDataLab/MinerU)), which supports hierarchical classification of headings, thereby enhancing document structuring.

2025/01/10 1.0.1 released

This is our first official release, where we have introduced a completely new API interface and enhanced compatibility through extensive refactoring, as well as a brand new automatic language identification feature:

- **New API Interface**
  - For the data-side API, we have introduced the Dataset class, designed to provide a robust and flexible data processing framework. This framework currently supports a variety of document formats, including images (.jpg and .png), PDFs, Word documents (.doc and .docx), and PowerPoint presentations (.ppt and .pptx). It ensures effective support for data processing tasks ranging from simple to complex.
  - For the user-side API, we have meticulously designed the MinerU processing workflow as a series of composable Stages. Each Stage represents a specific processing step, allowing users to define new Stages according to their needs and creatively combine these stages to customize their data processing workflows.
- **Enhanced Compatibility**
  - By optimizing the dependency environment and configuration items, we ensure stable and efficient operation on ARM architecture Linux systems.
  - We have deeply integrated with Huawei Ascend NPU acceleration, providing autonomous and controllable high-performance computing capabilities. This supports the localization and development of AI application platforms in China. [Ascend NPU Acceleration](https://github.com/opendatalab/MinerU/blob/master/docs/README_Ascend_NPU_Acceleration_zh_CN.md)
- **Automatic Language Identification**
  - By introducing a new language recognition model, setting the `lang` configuration to `auto` during document parsing will automatically select the appropriate OCR language model, improving the accuracy of scanned document parsing.

2024/11/22 0.10.0 released

Introducing hybrid OCR text extraction capabilities:

- Significantly improved parsing performance in complex text distribution scenarios such as dense formulas, irregular span regions, and text represented by images.
- Combines the dual advantages of accurate content extraction and faster speed in text mode, and more precise span/line region recognition in OCR mode.

2024/11/15 0.9.3 released

Integrated [RapidTable](https://github.com/RapidAI/RapidTable) for table recognition, improving single-table parsing speed by more than 10 times, with higher accuracy and lower GPU memory usage.

2024/11/06 0.9.2 released

Integrated the [StructTable-InternVL2-1B](https://huggingface.co/U4R/StructTable-InternVL2-1B) model for table recognition functionality.

2024/10/31 0.9.0 released

This is a major new version with extensive code refactoring, addressing numerous issues, improving performance, reducing hardware requirements, and enhancing usability:

- Refactored the sorting module code to use [layoutreader](https://github.com/ppaanngggg/layoutreader) for reading order sorting, ensuring high accuracy in various layouts.
- Refactored the paragraph concatenation module to achieve good results in cross-column, cross-page, cross-figure, and cross-table scenarios.
- Refactored the list and table of contents recognition functions, significantly improving the accuracy of list blocks and table of contents blocks, as well as the parsing of corresponding text paragraphs.
- Refactored the matching logic for figures, tables, and descriptive text, greatly enhancing the accuracy of matching captions and footnotes to figures and tables, and reducing the loss rate of descriptive text to near zero.
- Added multi-language support for OCR, supporting detection and recognition of 84 languages. For the list of supported languages, see [OCR Language Support List](https://paddlepaddle.github.io/PaddleOCR/latest/en/ppocr/blog/multi_languages.html#5-support-languages-and-abbreviations).
- Added memory recycling logic and other memory optimization measures, significantly reducing memory usage. The memory requirement for enabling all acceleration features except table acceleration (layout/formula/OCR) has been reduced from 16GB to 8GB, and the memory requirement for enabling all acceleration features has been reduced from 24GB to 10GB.
- Optimized configuration file feature switches, adding an independent formula detection switch to significantly improve speed and parsing results when formula detection is not needed.
- Integrated [PDF-Extract-Kit 1.0](https://github.com/opendatalab/PDF-Extract-Kit):

  - Added the self-developed `doclayout_yolo` model, which speeds up processing by more than 10 times compared to the original solution while maintaining similar parsing effects, and can be freely switched with `layoutlmv3` via the configuration file.
  - Upgraded formula parsing to `unimernet 0.2.1`, improving formula parsing accuracy while significantly reducing memory usage.
  - Due to the repository change for `PDF-Extract-Kit 1.0`, you need to re-download the model. Please refer to [How to Download Models](https://github.com/opendatalab/MinerU/blob/master/docs/how_to_download_models_en.md) for detailed steps.

2024/09/27 Version 0.8.1 released

Fixed some bugs, and providing a [localized deployment version](https://github.com/opendatalab/MinerU/blob/master/projects/web_demo/README.md) of the [online demo](https://opendatalab.com/OpenSourceTools/Extractor/PDF/) and the [front-end interface](https://github.com/opendatalab/MinerU/blob/master/projects/web/README.md).

2024/09/09 Version 0.8.0 released

Supporting fast deployment with Dockerfile, and launching demos on Huggingface and Modelscope.

2024/08/30 Version 0.7.1 released

Add paddle tablemaster table recognition option

2024/08/09 Version 0.7.0b1 released

Simplified installation process, added table recognition functionality

2024/08/01 Version 0.6.2b1 released

Optimized dependency conflict issues and installation documentation

2024/07/05 Initial open-source release

# MinerU

[Permalink: MinerU](https://github.com/opendatalab/MinerU/blob/master/README.md#mineru)

## Project Introduction

[Permalink: Project Introduction](https://github.com/opendatalab/MinerU/blob/master/README.md#project-introduction)

MinerU is a tool that converts PDFs into machine-readable formats (e.g., markdown, JSON), allowing for easy extraction into any format.
MinerU was born during the pre-training process of [InternLM](https://github.com/InternLM/InternLM). We focus on solving symbol conversion issues in scientific literature and hope to contribute to technological development in the era of large models.
Compared to well-known commercial products, MinerU is still young. If you encounter any issues or if the results are not as expected, please submit an issue on [issue](https://github.com/opendatalab/MinerU/issues) and **attach the relevant PDF**.

pdf\_zh\_cn.mp4

## Key Features

[Permalink: Key Features](https://github.com/opendatalab/MinerU/blob/master/README.md#key-features)

- Remove headers, footers, footnotes, page numbers, etc., to ensure semantic coherence.
- Output text in human-readable order, suitable for single-column, multi-column, and complex layouts.
- Preserve the structure of the original document, including headings, paragraphs, lists, etc.
- Extract images, image descriptions, tables, table titles, and footnotes.
- Automatically recognize and convert formulas in the document to LaTeX format.
- Automatically recognize and convert tables in the document to HTML format.
- Automatically detect scanned PDFs and garbled PDFs and enable OCR functionality.
- OCR supports detection and recognition of 109 languages.
- Supports multiple output formats, such as multimodal and NLP Markdown, JSON sorted by reading order, and rich intermediate formats.
- Supports various visualization results, including layout visualization and span visualization, for efficient confirmation of output quality.
- Supports running in a pure CPU environment, and also supports GPU(CUDA)/NPU(CANN)/MPS acceleration
- Compatible with Windows, Linux, and Mac platforms.

# Quick Start

[Permalink: Quick Start](https://github.com/opendatalab/MinerU/blob/master/README.md#quick-start)

If you encounter any installation issues, please first consult the [FAQ](https://github.com/opendatalab/MinerU/blob/master/README.md#faq).

If the parsing results are not as expected, refer to the [Known Issues](https://github.com/opendatalab/MinerU/blob/master/README.md#known-issues).

## Online Experience

[Permalink: Online Experience](https://github.com/opendatalab/MinerU/blob/master/README.md#online-experience)

### Official online web application

[Permalink: Official online web application](https://github.com/opendatalab/MinerU/blob/master/README.md#official-online-web-application)

The official online version has the same functionality as the client, with a beautiful interface and rich features, requires login to use

- [![OpenDataLab](https://camo.githubusercontent.com/afffec322e28672cd438b1aee4f210450d2123cb23fc3e28cdb6c3b3bf5ad287/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f7765626170705f6f6e5f6d696e6572752e6e65742d626c75653f6c6f676f3d646174613a696d6167652f7376672b786d6c3b6261736536342c50484e325a79423361575230614430694d544d304969426f5a576c6e61485139496a457a4e43496765473173626e4d39496d6830644841364c79393364336375647a4d7562334a6e4c7a49774d44417663335a6e496a3438634746306143426b50534a744d5449794c446c6a4d4377314c5451734f5330354c446c7a4c546b744e4330354c546b734e4330354c446b744f5377354c4451734f537735656949675a6d6c736244306964584a734b434e684b534976506a78775958526f49475139496d30784d6a49734f574d774c4455744e4377354c546b734f584d744f5330304c546b744f5377304c546b734f5330354c446b734e4377354c446c364969426d615778735053496a4d4445774d5441784969382b50484268644767675a44306962546b784c444534597a41734e5330304c446b744f537735637930354c5451744f5330354c4451744f5377354c546b734f5377304c446b734f586f6949475a7062477739496e56796243676a59696b694c7a3438634746306143426b50534a744f5445734d54686a4d4377314c5451734f5330354c446c7a4c546b744e4330354c546b734e4330354c446b744f5377354c4451734f537735656949675a6d6c7362443069497a41784d4445774d534976506a78775958526f49475a7062477774636e56735a5430695a585a6c626d396b5a43496759327870634331796457786c50534a6c646d56756232526b4969426b50534a744d7a6b734e6a4a6a4d4377784e6977344c444d774c4449774c444d344c4463744e6977784d6930784e6977784d6930794e6c59304f574d774c5451734d7930334c4459744f4777304e6930784d6d4d314c5445734d5445734d7977784d537734646a4d78597a41734d7a63744d7a41734e6a59744e6a59734e6a59744d7a63734d4330324e69307a4d4330324e6930324e6c59304e6d4d774c5451734d7930334c4459744f4777794d433032597a55744d5377784d53777a4c4445784c4468324d6a4636625330794f537732597a41734d5459734e69777a4d4377784e7977304d43777a4c4445734e5377784c4467734d5377314c4441734d5441744d5377784e53307a517a4d334c446b314c4449354c4463354c4449354c445979566a5179624330784f537731646a4977656949675a6d6c736244306964584a734b434e6a4b534976506a78775958526f49475a7062477774636e56735a5430695a585a6c626d396b5a43496759327870634331796457786c50534a6c646d56756232526b4969426b50534a744d7a6b734e6a4a6a4d4377784e6977344c444d774c4449774c444d344c4463744e6977784d6930784e6977784d6930794e6c59304f574d774c5451734d7930334c4459744f4777304e6930784d6d4d314c5445734d5445734d7977784d537734646a4d78597a41734d7a63744d7a41734e6a59744e6a59734e6a59744d7a63734d4330324e69307a4d4330324e6930324e6c59304e6d4d774c5451734d7930334c4459744f4777794d433032597a55744d5377784d53777a4c4445784c4468324d6a4636625330794f537732597a41734d5459734e69777a4d4377784e7977304d43777a4c4445734e5377784c4467734d5377314c4441734d5441744d5377784e53307a517a4d334c446b314c4449354c4463354c4449354c445979566a5179624330784f537731646a4977656949675a6d6c7362443069497a41784d4445774d534976506a786b5a575a7a506a78736157356c59584a48636d466b61575675644342705a4430695953496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a78736157356c59584a48636d466b61575675644342705a4430695969496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a78736157356c59584a48636d466b61575675644342705a4430695979496765444539496a6730496942354d5430694e44456949486779505349334e53496765544939496a45794d4349675a334a685a476c6c626e5256626d6c30637a306964584e6c636c4e7759574e6c5432355663325569506a787a6447397749484e3062334174593239736233493949694e6d5a6d59694c7a343863335276634342765a6d5a7a5a585139496a456949484e3062334174593239736233493949694d795a544a6c4d6d55694c7a34384c327870626d5668636b6479595752705a573530506a77765a47566d637a34384c334e325a7a343d266c6162656c436f6c6f723d7768697465)](https://mineru.net/OpenSourceTools/Extractor?source=github)

### Gradio-based online demo

[Permalink: Gradio-based online demo](https://github.com/opendatalab/MinerU/blob/master/README.md#gradio-based-online-demo)

A WebUI developed based on Gradio, with a simple interface and only core parsing functionality, no login required

- [![ModelScope](https://camo.githubusercontent.com/733f6a03b861d1c5d9f9216122a60111c8b92368793df4b37e648c0e61288868/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f44656d6f5f6f6e5f4d6f64656c53636f70652d707572706c653f6c6f676f3d646174613a696d6167652f7376672b786d6c3b6261736536342c50484e325a79423361575230614430694d6a497a4969426f5a576c6e61485139496a49774d43496765473173626e4d39496d6830644841364c79393364336375647a4d7562334a6e4c7a49774d44417663335a6e496a344b436941385a7a344b4943413864476c306247552b544746355a5849674d54777664476c306247552b43694167504842686447676761575139496e4e325a3138784e4349675a6d6c7362443069497a59794e47466d5a6949675a443069625441734f446b754f4452734d6a55754e6a55734d4777774c4449314c6a59304f546b35624330794e5334324e537777624441734c5449314c6a59304f546b356569497650676f67494478775958526f49476c6b50534a7a646d64664d54556949475a706247773949694d324d6a52685a6d596949475139496d30354f5334784e4377784d5455754e446c734d6a55754e6a55734d4777774c4449314c6a5931624330794e5334324e537777624441734c5449314c6a59316569497650676f67494478775958526f49476c6b50534a7a646d64664d54596949475a706247773949694d324d6a52685a6d596949475139496d30784e7a59754d446b734d5451784c6a4530624330794e5334324e446b354f537777624441734d6a49754d546c734e4463754f4451734d4777774c4330304e7934344e4777744d6a49754d546b734d4777774c4449314c6a59316569497650676f67494478775958526f49476c6b50534a7a646d64664d54636949475a706247773949694d7a4e6d4e6d5a44456949475139496d30784d6a51754e7a6b734f446b754f4452734d6a55754e6a55734d4777774c4449314c6a59304f546b35624330794e5334324e537777624441734c5449314c6a59304f546b356569497650676f67494478775958526f49476c6b50534a7a646d64664d54676949475a706247773949694d7a4e6d4e6d5a44456949475139496d30774c4459304c6a4535624449314c6a59314c4442734d4377794e5334324e5777744d6a55754e6a55734d4777774c4330794e5334324e586f694c7a344b4943413863474630614342705a44306963335a6e587a45354969426d615778735053496a4e6a493059575a6d4969426b50534a744d546b344c6a49344c4467354c6a6730624449314c6a59304f546b354c4442734d4377794e5334324e446b354f5777744d6a55754e6a51354f546b734d4777774c4330794e5334324e446b354f586f694c7a344b4943413863474630614342705a44306963335a6e587a49774969426d615778735053496a4d7a5a6a5a6d51784969426b50534a744d546b344c6a49344c4459304c6a4535624449314c6a59304f546b354c4442734d4377794e5334324e5777744d6a55754e6a51354f546b734d4777774c4330794e5334324e586f694c7a344b4943413863474630614342705a44306963335a6e587a49784969426d615778735053496a4e6a493059575a6d4969426b50534a744d5455774c6a51304c445179624441734d6a49754d546c734d6a55754e6a51354f546b734d4777774c4449314c6a5931624449794c6a45354c4442734d4377744e4463754f4452734c5451334c6a67304c4442364969382b43694167504842686447676761575139496e4e325a3138794d6949675a6d6c7362443069497a4d3259325a6b4d5349675a4430696254637a4c6a51354c4467354c6a6730624449314c6a59314c4442734d4377794e5334324e446b354f5777744d6a55754e6a55734d4777774c4330794e5334324e446b354f586f694c7a344b4943413863474630614342705a44306963335a6e587a497a4969426d615778735053496a4e6a493059575a6d4969426b50534a744e4463754f4451734e6a51754d546c734d6a55754e6a55734d4777774c4330794d6934784f5777744e4463754f4451734d4777774c4451334c6a6730624449794c6a45354c4442734d4377744d6a55754e6a56364969382b43694167504842686447676761575139496e4e325a3138794e4349675a6d6c7362443069497a59794e47466d5a6949675a443069625451334c6a67304c4445784e5334304f5777744d6a49754d546b734d4777774c4451334c6a6730624451334c6a67304c4442734d4377744d6a49754d546c734c5449314c6a59314c4442734d4377744d6a55754e6a56364969382b436941384c32632b436a777663335a6e50673d3d266c6162656c436f6c6f723d7768697465)](https://www.modelscope.cn/studios/OpenDataLab/MinerU)
- [![HuggingFace](https://camo.githubusercontent.com/7dfca7e1d8709395d5b4c92a2f9008f678e7dd8c2b6d01550976be0282f063ef/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f44656d6f5f6f6e5f48756767696e67466163652d79656c6c6f772e7376673f6c6f676f3d646174613a696d6167652f706e673b6261736536342c6956424f5277304b47676f414141414e5355684555674141414638414141425943414d414141436b6c39742f414141416b31424d5645564863457a2f6e51762f6e51762f6e51722f6e51762f6e51722f6e51762f6e51762f6e51722f7752662f7478542f7067372f7952722f7242442f7a527a2f6e67762f6f417a2f7a687a2f6e77762f7478542f6e67762f3042332b7a427a2f6e51762f3068372f77786e2f7652622f7468586b7569542f7278482f7078442f6f677a637179662f6e5176546c537a2f637a43786b79372f536a6966646a542f4d6a332b4d6a33774d6a313561546e444e7a2b445344395254554273503046524f3051364f305779497845494141414147485253546c4d414442387a535746336b7244447738544a314e625835656676386666392f66784b444a3975414141474b6b6c45515652343275325a3633716a4f41794743345277434f6642324a41477172536232576e54772f316633556157635347594e4b5464662f502b6d4f6b5472452b794a42756c7666764c543241357275656e61564879496b7333336e706c2f364334732f5a4c414d3435534f692f3146745a5079467572314f596f66425833773764353442786d2b453864622b6e4472313274746d45535a347a6c75644a4547355337544f373259506c4b5a4679452b594359554a54425a734d694e53355364374e6c446d4b4d324567324a516738617762676c667167626841726a786b533764677032524836686339414d4c645a5955745a4e35444a72346d6f6c433842664b72456b504b456e45566a4c62675731664c7937375a564f4a61676f49634c496c2b497861515a476a6958353937486f704635436b6158564d444f395079697833414656336b77346c514c436248754d6f767a3846616c6c626351494a35546130766b7339526e6f6c62434b383442746a4b5253357541343368596f5a634f424749473245706276364376465651386d386c6f683636574e7953736e4e3768744c35384c4e702b4e5854382f506858694258504d6a4c5378747770385739662f31416e6752696572426b412b6b6b2f497055534f654b42797a6e3879336b41414166682f2f306f58675634726f486d2f6b7a3445327a2f2f7a5263332f6c6777427a624d326d4a7851456135707167583764314c306874726878374c4b784f5a6c4b627763415779454f577159534938595074674451566a7042356e76614861536e426151534436687765446938506f737844362f50543039595933785141374c5443544b6659582b5148704130474363716d454876722f6379664b5154457577676273326b50784a454230694e6a664a63435450796f63782b413067726948536d4144694339316f4e4756774a363952756459653635764a6d6f716670756c306c727158616457306a464b4835424b77416543712b44656e37732b337a66524a7a4136312f556a2f39482f567a4c4b5478396a46505064586565502b4c37574576444c414b41496f46386250544b54302b544d37573865506a33527a2f596e336b4f41703266314b663057656f6e7937706e2f6350796476685159562b65464f666d4f753756422f5669506533342f454e33524648592f7952755438646443744d50482f4d6342415435732b765264652f676632632f7350736a4c4b2b6d354942514635744f2b683274546c42476e50363639334a6473766f666a4f506e6e45486b6832546e562f583166426c3953357a7277757746384e467241564a567743415054653867614a6c6f6d716c7030707634506a6e3938744a2f742f664c2b2b36756e705231594743326e2f4b436f613074544c6f4b6945655550446c39346e6a2b352f5476332f6554357642513630583153306f5a722b49575252384c64687537416c4c6a5049536c4a634f397672466f746b793953707a446571756c7745697235626559416330523744394b533144587661306a68595244586f4578506463367977354753686b5a58653951644f2f754f76486f66786a72562f544e5336694d4a532b3454635354676b396e3561674a64425162422f2f4966462f48707650743354626937623649364b305237327036616a7279454a72454e57326262655655476a66676f616c73344c3434336337424545346d4a4f32537062526e67785172414b527564527a4751386a564f4c327144566a6a49384b3167633354494a354b69465a31712b67647341525042344e515334416a77565374373244536f584e794f57557255356d51396e5259796a703839586f376f52493642676139514e54316d512f7074614a7135542f37576367415a7977522f586c5047415544646574334c452b71533054492b672b614a55384d49716a6f304b78384c792b6d61784c6a4a6d6a51313872413059436b784c5162555a50315771646d7951474a4c556d37566e5146716f646d5853716d527264567071647a6b354c766d76677445635738504d476461533233454f577944566241435a7a554a5061714d626a44787041335172676c3041696b696d474462716d79543850384e4f596971726c64463872582b594e37546f705834556f4875534359593763675834674877636c514b6c317a6878305448662b7443415556616c7a6a493757673945687074726b496366494a6a41393465764f6e384232654861567a7642726e6c32696730536f36687650617a304947634f7654487655496c45322b70727141784c5351785a6c55327374716c314e7143434c644969494e2f693144424548556f456c4d3964427261766269416e4b716770693449426b772b75745350496f42696a44584a6970535656374d704f454a55416335516d6d33426e554e2b7733687465456965594b66525a53495563584b4d5666307535774434457773554e56765a4f745554374132476b6666486a42795770487176524259725456373261366a387a5a3657304454453836486e3034626d795758335269395748375a55365137682b5a486f306e4855416373517656685852445a484368776979692f686e50754f735345463645786b336f365939445431655a2b36634153586b3259396b2b36454f514d44476d3657424b3130774f514a43427772656e383663505057556352416e54566a476355314c4267733946555269582f6536343739795a634c7743426d54786961774577724f636c6575753132743374624c762f4e34524c594942685965786d3746636e344f4a636e302b7a632b73382f5666506564645a4841474e365454386547637a4864522f477473312f4d7a446b54687232337a71725666414d465433334e7831524a7378316b357a7557494c4c6e472f7673482b46763544344e5456637031477a6f384141414141456c46546b5375516d4343266c6162656c436f6c6f723d7768697465)](https://huggingface.co/spaces/opendatalab/MinerU)

## Local Deployment

[Permalink: Local Deployment](https://github.com/opendatalab/MinerU/blob/master/README.md#local-deployment)

Warning

**Pre-installation Notice—Hardware and Software Environment Support**

To ensure the stability and reliability of the project, we only optimize and test for specific hardware and software environments during development. This ensures that users deploying and running the project on recommended system configurations will get the best performance with the fewest compatibility issues.

By focusing resources on the mainline environment, our team can more efficiently resolve potential bugs and develop new features.

In non-mainline environments, due to the diversity of hardware and software configurations, as well as third-party dependency compatibility issues, we cannot guarantee 100% project availability. Therefore, for users who wish to use this project in non-recommended environments, we suggest carefully reading the documentation and FAQ first. Most issues already have corresponding solutions in the FAQ. We also encourage community feedback to help us gradually expand support.

| Parsing Backend | pipeline <br> (Accuracy1 82+) | vlm (Accuracy1 90+) |
| --- | --- | --- |
| transformers | mlx-engine | vllm-engine / <br>vllm-async-engine | lmdeploy-engine | http-client |
| --- | --- | --- | --- | --- |
| Backend Features | Fast, no hallucinations | Good compatibility, <br>but slower | Faster than transformers | Fast, compatible with the vLLM ecosystem | Fast, compatible with the LMDeploy ecosystem | Suitable for OpenAI-compatible servers6 |
| Operating System | Linux2 / Windows / macOS | macOS3 | Linux2 / Windows4 | Linux2 / Windows5 | Any |
| CPU inference support | ✅ | ❌ | Not required |
| GPU Requirements | Volta or later architectures, 6 GB VRAM or more, or Apple Silicon | Apple Silicon | Volta or later architectures, 8 GB VRAM or more | Not required |
| Memory Requirements | Minimum 16 GB, 32 GB recommended | 8 GB |
| Disk Space Requirements | 20 GB or more, SSD recommended | 2 GB |
| Python Version | 3.10-3.137 |

1 Accuracy metric is the End-to-End Evaluation Overall score of OmniDocBench (v1.5), tested on the latest `MinerU` version.

2 Linux supports only distributions released in 2019 or later.

3 MLX requires macOS 13.5 or later, recommended for use with version 14.0 or higher.

4 Windows vLLM support via WSL2(Windows Subsystem for Linux).

5 Windows LMDeploy can only use the `turbomind` backend, which is slightly slower than the `pytorch` backend. If performance is critical, it is recommended to run it via WSL2.

6 Servers compatible with the OpenAI API, such as local or remote model services deployed via inference frameworks like `vLLM`, `SGLang`, or `LMDeploy`.

7 Windows + LMDeploy only supports Python versions 3.10–3.12, as the critical dependency `ray` does not yet support Python 3.13 on Windows.

### Install MinerU

[Permalink: Install MinerU](https://github.com/opendatalab/MinerU/blob/master/README.md#install-mineru)

#### Install MinerU using pip or uv

[Permalink: Install MinerU using pip or uv](https://github.com/opendatalab/MinerU/blob/master/README.md#install-mineru-using-pip-or-uv)

```
pip install --upgrade pip
pip install uv
uv pip install -U "mineru[core]"
```

#### Install MinerU from source code

[Permalink: Install MinerU from source code](https://github.com/opendatalab/MinerU/blob/master/README.md#install-mineru-from-source-code)

```
git clone https://github.com/opendatalab/MinerU.git
cd MinerU
uv pip install -e .[core]
```

Tip

`mineru[core]` includes all core features except `vLLM`/`LMDeploy` acceleration, compatible with Windows / Linux / macOS systems, suitable for most users.
If you need to use `vLLM`/`LMDeploy` acceleration for VLM model inference or install a lightweight client on edge devices, please refer to the documentation [Extension Modules Installation Guide](https://opendatalab.github.io/MinerU/quick_start/extension_modules/).

* * *

#### Deploy MinerU using Docker

[Permalink: Deploy MinerU using Docker](https://github.com/opendatalab/MinerU/blob/master/README.md#deploy-mineru-using-docker)

MinerU provides a convenient Docker deployment method, which helps quickly set up the environment and solve some tricky environment compatibility issues.
You can get the [Docker Deployment Instructions](https://opendatalab.github.io/MinerU/quick_start/docker_deployment/) in the documentation.

* * *

### Using MinerU

[Permalink: Using MinerU](https://github.com/opendatalab/MinerU/blob/master/README.md#using-mineru)

The simplest command line invocation is:

```
mineru -p <input_path> -o <output_path>
```

You can use MinerU for PDF parsing through various methods such as command line, API, and WebUI. For detailed instructions, please refer to the [Usage Guide](https://opendatalab.github.io/MinerU/usage/).

# TODO

[Permalink: TODO](https://github.com/opendatalab/MinerU/blob/master/README.md#todo)

- [x]  Reading order based on the model
- [x]  Recognition of `index` and `list` in the main text
- [x]  Table recognition
- [x]  Heading Classification
- [x]  Handwritten Text Recognition
- [x]  Vertical Text Recognition
- [x]  Latin Accent Mark Recognition
- [x]  Code block recognition in the main text
- [x] [Chemical formula recognition](https://github.com/opendatalab/MinerU/blob/master/docs/chemical_knowledge_introduction/introduction.pdf)(mineru.net)
- [ ]  Geometric shape recognition

# Known Issues

[Permalink: Known Issues](https://github.com/opendatalab/MinerU/blob/master/README.md#known-issues)

- Reading order is determined by the model based on the spatial distribution of readable content, and may be out of order in some areas under extremely complex layouts.
- Limited support for vertical text.
- Tables of contents and lists are recognized through rules, and some uncommon list formats may not be recognized.
- Code blocks are not yet supported in the layout model.
- Comic books, art albums, primary school textbooks, and exercises cannot be parsed well.
- Table recognition may result in row/column recognition errors in complex tables.
- OCR recognition may produce inaccurate characters in PDFs of lesser-known languages (e.g., diacritical marks in Latin script, easily confused characters in Arabic script).
- Some formulas may not render correctly in Markdown.

# FAQ

[Permalink: FAQ](https://github.com/opendatalab/MinerU/blob/master/README.md#faq)

- If you encounter any issues during usage, you can first check the [FAQ](https://opendatalab.github.io/MinerU/faq/) for solutions.
- If your issue remains unresolved, you may also use [DeepWiki](https://deepwiki.com/opendatalab/MinerU) to interact with an AI assistant, which can address most common problems.
- If you still cannot resolve the issue, you are welcome to join our community via [Discord](https://discord.gg/Tdedn9GTXq) or [WeChat](https://mineru.net/community-portal/?aliasId=3c430f94) to discuss with other users and developers.

# All Thanks To Our Contributors

[Permalink: All Thanks To Our Contributors](https://github.com/opendatalab/MinerU/blob/master/README.md#all-thanks-to-our-contributors)

[![](https://camo.githubusercontent.com/8069d469dcf247604efc2f58d49571257a1981329f52a5747a07e9929aa1baad/68747470733a2f2f636f6e747269622e726f636b732f696d6167653f7265706f3d6f70656e646174616c61622f4d696e657255)](https://github.com/opendatalab/MinerU/graphs/contributors)

# License Information

[Permalink: License Information](https://github.com/opendatalab/MinerU/blob/master/README.md#license-information)

[LICENSE.md](https://github.com/opendatalab/MinerU/blob/master/LICENSE.md)

Currently, some models in this project are trained based on YOLO. However, since YOLO follows the AGPL license, it may impose restrictions on certain use cases. In future iterations, we plan to explore and replace these with models under more permissive licenses to enhance user-friendliness and flexibility.

# Acknowledgments

[Permalink: Acknowledgments](https://github.com/opendatalab/MinerU/blob/master/README.md#acknowledgments)

- [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit)
- [DocLayout-YOLO](https://github.com/opendatalab/DocLayout-YOLO)
- [UniMERNet](https://github.com/opendatalab/UniMERNet)
- [RapidTable](https://github.com/RapidAI/RapidTable)
- [TableStructureRec](https://github.com/RapidAI/TableStructureRec)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [PaddleOCR2Pytorch](https://github.com/frotms/PaddleOCR2Pytorch)
- [layoutreader](https://github.com/ppaanngggg/layoutreader)
- [xy-cut](https://github.com/Sanster/xy-cut)
- [fast-langdetect](https://github.com/LlmKira/fast-langdetect)
- [pypdfium2](https://github.com/pypdfium2-team/pypdfium2)
- [pdftext](https://github.com/datalab-to/pdftext)
- [pdfminer.six](https://github.com/pdfminer/pdfminer.six)
- [pypdf](https://github.com/py-pdf/pypdf)
- [magika](https://github.com/google/magika)
- [vLLM](https://github.com/vllm-project/vllm)
- [LMDeploy](https://github.com/InternLM/lmdeploy)

# Citation

[Permalink: Citation](https://github.com/opendatalab/MinerU/blob/master/README.md#citation)

```
@misc{niu2025mineru25decoupledvisionlanguagemodel,
      title={MinerU2.5: A Decoupled Vision-Language Model for Efficient High-Resolution Document Parsing},
      author={Junbo Niu and Zheng Liu and Zhuangcheng Gu and Bin Wang and Linke Ouyang and Zhiyuan Zhao and Tao Chu and Tianyao He and Fan Wu and Qintong Zhang and Zhenjiang Jin and Guang Liang and Rui Zhang and Wenzheng Zhang and Yuan Qu and Zhifei Ren and Yuefeng Sun and Yuanhong Zheng and Dongsheng Ma and Zirui Tang and Boyu Niu and Ziyang Miao and Hejun Dong and Siyi Qian and Junyuan Zhang and Jingzhou Chen and Fangdong Wang and Xiaomeng Zhao and Liqun Wei and Wei Li and Shasha Wang and Ruiliang Xu and Yuanyuan Cao and Lu Chen and Qianqian Wu and Huaiyu Gu and Lindong Lu and Keming Wang and Dechen Lin and Guanlin Shen and Xuanhe Zhou and Linfeng Zhang and Yuhang Zang and Xiaoyi Dong and Jiaqi Wang and Bo Zhang and Lei Bai and Pei Chu and Weijia Li and Jiang Wu and Lijun Wu and Zhenxiang Li and Guangyu Wang and Zhongying Tu and Chao Xu and Kai Chen and Yu Qiao and Bowen Zhou and Dahua Lin and Wentao Zhang and Conghui He},
      year={2025},
      eprint={2509.22186},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2509.22186},
}

@misc{wang2024mineruopensourcesolutionprecise,
      title={MinerU: An Open-Source Solution for Precise Document Content Extraction},
      author={Bin Wang and Chao Xu and Xiaomeng Zhao and Linke Ouyang and Fan Wu and Zhiyuan Zhao and Rui Xu and Kaiwen Liu and Yuan Qu and Fukai Shang and Bo Zhang and Liqun Wei and Zhihao Sui and Wei Li and Botian Shi and Yu Qiao and Dahua Lin and Conghui He},
      year={2024},
      eprint={2409.18839},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2409.18839},
}

@article{he2024opendatalab,
  title={Opendatalab: Empowering general artificial intelligence with open datasets},
  author={He, Conghui and Li, Wei and Jin, Zhenjiang and Xu, Chao and Wang, Bin and Lin, Dahua},
  journal={arXiv preprint arXiv:2407.13773},
  year={2024}
}
```

# Star History

[Permalink: Star History](https://github.com/opendatalab/MinerU/blob/master/README.md#star-history)

![Star History Chart](https://camo.githubusercontent.com/40ca9c73efb26805e0af7b399b8bc91a2d7fe54e6cb313e5a7f5ce59bfd0bfab/68747470733a2f2f6170692e737461722d686973746f72792e636f6d2f7376673f7265706f733d6f70656e646174616c61622f4d696e65725526747970653d44617465)

# Links

[Permalink: Links](https://github.com/opendatalab/MinerU/blob/master/README.md#links)

- [Easy Data Preparation with latest LLMs-based Operators and Pipelines](https://github.com/OpenDCAI/DataFlow)
- [Vis3 (OSS browser based on s3)](https://github.com/opendatalab/Vis3)
- [LabelU (A Lightweight Multi-modal Data Annotation Tool)](https://github.com/opendatalab/labelU)
- [LabelLLM (An Open-source LLM Dialogue Annotation Platform)](https://github.com/opendatalab/LabelLLM)
- [PDF-Extract-Kit (A Comprehensive Toolkit for High-Quality PDF Content Extraction)](https://github.com/opendatalab/PDF-Extract-Kit)
- [OmniDocBench (A Comprehensive Benchmark for Document Parsing and Evaluation)](https://github.com/opendatalab/OmniDocBench)
- [Magic-HTML (Mixed web page extraction tool)](https://github.com/opendatalab/magic-html)
- [Magic-Doc (Fast speed ppt/pptx/doc/docx/pdf extraction tool)](https://github.com/InternLM/magic-doc)
- [Dingo: A Comprehensive AI Data Quality Evaluation Tool](https://github.com/MigoXLab/dingo)

You can’t perform that action at this time.
