Script to add postcode data into [osmnames data extract](https://osmnames.org/download/) for france.
Postcode data comes from [](https://datanova.legroupe.laposte.fr/explore/dataset/liste-des-communes-francaises/export/?disjunctive.nom_complet&disjunctive.cdc&disjunctive.cheflieu&disjunctive.dep) and ()[https://datanova.legroupe.laposte.fr/explore/dataset/laposte_hexasmal/export/?disjunctive.code_commune_insee&disjunctive.nom_de_la_commune&disjunctive.code_postal&disjunctive.libell_d_acheminement&disjunctive.ligne_5] aggregate into a mongo database.
The relation is made thanks to the city name.