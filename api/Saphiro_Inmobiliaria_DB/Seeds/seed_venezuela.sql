-- ============================================================
-- SCRIPT DE DATOS GEOGRÁFICOS DE VENEZUELA
-- Estados, Ciudades y Sectores
-- ============================================================

-- ==========================================
-- 1. ESTADOS
-- ==========================================
INSERT INTO "estados" ("id", "nombre") VALUES
(1, 'Amazonas'),
(2, 'Anzoátegui'),
(3, 'Apure'),
(4, 'Aragua'),
(5, 'Barinas'),
(6, 'Bolívar'),
(7, 'Carabobo'),
(8, 'Cojedes'),
(9, 'Delta Amacuro'),
(10, 'Distrito Capital'),
(11, 'Falcón'),
(12, 'Guárico'),
(13, 'Lara'),
(14, 'La Guaira'),
(15, 'Mérida'),
(16, 'Miranda'),
(17, 'Monagas'),
(18, 'Nueva Esparta'),
(19, 'Portuguesa'),
(20, 'Sucre'),
(21, 'Táchira'),
(22, 'Trujillo'),
(23, 'Yaracuy'),
(24, 'Zulia');
SELECT setval(pg_get_serial_sequence('estados', 'id'), 24);

-- ==========================================
-- 2. CIUDADES
-- ==========================================
INSERT INTO "ciudades" ("id", "estado_id", "nombre") VALUES

-- Amazonas (1)
(1, 1, 'Puerto Ayacucho'),
(2, 1, 'La Esmeralda'),
(3, 1, 'San Fernando de Atabapo'),
(4, 1, 'Isla Ratón'),
(5, 1, 'San Juan de Manapiare'),
(6, 1, 'Maroa'),
(7, 1, 'San Carlos de Río Negro'),

-- Anzoátegui (2)
(8, 2, 'Anaco'),
(9, 2, 'Barcelona'),
(10, 2, 'Puerto La Cruz'),
(11, 2, 'Guanta'),
(12, 2, 'El Tigre'),
(13, 2, 'Lechería'),
(14, 2, 'Pariaguán'),
(15, 2, 'Clarines'),
(16, 2, 'Cantaura'),
(17, 2, 'Píritu'),
(18, 2, 'Aragua de Barcelona'),
(19, 2, 'Onoto'),
(20, 2, 'Valle de Guanape'),
(21, 2, 'San José de Guanipa'),
(22, 2, 'Soledad'),
(23, 2, 'San Mateo'),
(24, 2, 'El Chaparro'),
(25, 2, 'Mapire'),
(26, 2, 'Boca de Uchire'),
(27, 2, 'Santa Ana'),
(28, 2, 'Puerto Píritu'),

-- Apure (3)
(29, 3, 'San Fernando de Apure'),
(30, 3, 'Achaguas'),
(31, 3, 'Biruaca'),
(32, 3, 'Bruzual'),
(33, 3, 'Guasdualito'),
(34, 3, 'Elorza'),
(35, 3, 'San Juan de Payara'),

-- Aragua (4)
(36, 4, 'Maracay'),
(37, 4, 'Las Tejerías'),
(38, 4, 'La Victoria'),
(39, 4, 'Villa de Cura'),
(40, 4, 'Turmero'),
(41, 4, 'San Mateo'),
(42, 4, 'Ocumare de la Costa'),
(43, 4, 'Barbacoas'),
(44, 4, 'El Limón'),
(45, 4, 'San Sebastián de los Reyes'),
(46, 4, 'Cagua'),
(47, 4, 'Colonia Tovar'),
(48, 4, 'Santa Cruz'),
(49, 4, 'Santa Rita'),
(50, 4, 'Camatagua'),
(51, 4, 'Palo Negro'),
(52, 4, 'El Consejo'),
(53, 4, 'San Casimiro'),

-- Barinas (5)
(54, 5, 'Barinas'),
(55, 5, 'Sabaneta'),
(56, 5, 'Barinitas'),
(57, 5, 'El Cantón'),
(58, 5, 'Arismendi'),
(59, 5, 'Santa Bárbara'),
(60, 5, 'Ciudad Bolivia'),
(61, 5, 'Obispos'),
(62, 5, 'Ciudad de Pedraza'),
(63, 5, 'Libertad'),
(64, 5, 'Ciudad de Nutrias'),
(65, 5, 'Socopó'),
(66, 5, 'Barrancas'),

-- Bolívar (6)
(67, 6, 'Ciudad Guayana (Puerto Ordaz)'),
(68, 6, 'San Félix'),
(69, 6, 'Ciudad Bolívar'),
(70, 6, 'Ciudad Piar'),
(71, 6, 'El Callao'),
(72, 6, 'Santa Elena de Uairén'),
(73, 6, 'Caicara del Orinoco'),
(74, 6, 'Tumeremo'),
(75, 6, 'Maripa'),
(76, 6, 'Upata'),
(77, 6, 'El Palmar'),
(78, 6, 'Guasipati'),
(79, 6, 'El Dorado'),

-- Carabobo (7)
(80, 7, 'Valencia'),
(81, 7, 'Puerto Cabello'),
(82, 7, 'Guacara'),
(83, 7, 'San Diego'),
(84, 7, 'San Joaquín'),
(85, 7, 'Naguanagua'),
(86, 7, 'Los Guayos'),
(87, 7, 'Bejuma'),
(88, 7, 'Mariara'),
(89, 7, 'Miranda'),
(90, 7, 'Morón'),
(91, 7, 'Montalbán'),
(92, 7, 'Güigüe'),
(93, 7, 'Tocuyito'),

-- Cojedes (8)
(94, 8, 'San Carlos'),
(95, 8, 'Cojedes'),
(96, 8, 'Tinaquillo'),
(97, 8, 'El Baúl'),
(98, 8, 'Macapo'),
(99, 8, 'El Pao'),
(100, 8, 'Libertad'),
(101, 8, 'Las Vegas'),
(102, 8, 'Tinaco'),

-- Delta Amacuro (9)
(103, 9, 'Tucupita'),
(104, 9, 'Curiapo'),
(105, 9, 'Sierra Imataca'),
(106, 9, 'Pedernales'),

-- Distrito Capital (10)
(107, 10, 'Caracas'),

-- Falcón (11)
(108, 11, 'Punto Fijo'),
(109, 11, 'San Juan de los Cayos'),
(110, 11, 'Coro'),
(111, 11, 'Los Taques'),
(112, 11, 'Las Piedras'),
(113, 11, 'Chichiriviche'),
(114, 11, 'Buchivacoa'),
(115, 11, 'Tucacas'),
(116, 11, 'Mirimire'),
(117, 11, 'Dabajuro'),
(118, 11, 'Mene de Mauroa'),
(119, 11, 'Pedregal'),
(120, 11, 'Palmasola'),
(121, 11, 'Píritu'),
(122, 11, 'Tocópero'),
(123, 11, 'Puerto Cumarebo'),
(124, 11, 'San Luis'),
(125, 11, 'Capatárida'),
(126, 11, 'La Vela de Coro'),
(127, 11, 'Churuguara'),
(128, 11, 'Jacura'),
(129, 11, 'Yaracal'),
(130, 11, 'Santa Ana de Coro'),
(131, 11, 'Cabure'),
(132, 11, 'La Cruz de Taratara'),
(133, 11, 'Santa Cruz de Bucaral'),
(134, 11, 'Urumaco'),

-- Guárico (12)
(135, 12, 'Camaguán'),
(136, 12, 'Altagracia de Orituco'),
(137, 12, 'El Socorro'),
(138, 12, 'Valle de la Pascua'),
(139, 12, 'Las Mercedes'),
(140, 12, 'Calabozo'),
(141, 12, 'San Gerónimo de Guayabal'),
(142, 12, 'Zaraza'),
(143, 12, 'Santa María de Ipire'),
(144, 12, 'Chaguaramas'),
(145, 12, 'Ortíz'),
(146, 12, 'San José de Guaribe'),
(147, 12, 'Tucupido'),
(148, 12, 'San Juan de los Morros'),
(149, 12, 'El Sombrero'),

-- Lara (13)
(150, 13, 'Barquisimeto'),
(151, 13, 'Quíbor'),
(152, 13, 'Cabudare'),
(153, 13, 'El Tocuyo'),
(154, 13, 'Carora'),
(155, 13, 'Siquisique'),
(156, 13, 'Sanare'),
(157, 13, 'Sarare'),
(158, 13, 'Duaca'),

-- La Guaira (14)
(159, 14, 'Maiquetía'),
(160, 14, 'La Guaira'),
(161, 14, 'Macuto'),
(162, 14, 'Catia La Mar'),

-- Mérida (15)
(163, 15, 'Mérida'),
(164, 15, 'El Vigía'),
(165, 15, 'Mucuchíes'),
(166, 15, 'Tovar'),
(167, 15, 'Nueva Bolivia'),
(168, 15, 'Bailadores'),
(169, 15, 'Santa Elena de Arenales'),
(170, 15, 'Pueblo Llano'),
(171, 15, 'Santo Domingo'),
(172, 15, 'La Azulita'),
(173, 15, 'Santa Cruz de Mora'),
(174, 15, 'Aricagua'),
(175, 15, 'Canaguá'),
(176, 15, 'Ejido'),
(177, 15, 'Tucaní'),
(178, 15, 'Guaraque'),
(179, 15, 'Arapuey'),
(180, 15, 'Torondoy'),
(181, 15, 'Timotes'),
(182, 15, 'Santa María de Caparo'),
(183, 15, 'Tabay'),
(184, 15, 'Lagunillas'),
(185, 15, 'Zea'),

-- Miranda (16)
(186, 16, 'Baruta'),
(187, 16, 'Chacao'),
(188, 16, 'El Hatillo'),
(189, 16, 'Petare'),
(190, 16, 'Carrizal'),
(191, 16, 'Charallave'),
(192, 16, 'Los Teques'),
(193, 16, 'San Antonio de los Altos'),
(194, 16, 'Ocumare del Tuy'),
(195, 16, 'Santa Lucía'),
(196, 16, 'Santa Teresa del Tuy'),
(197, 16, 'Caucagua'),
(198, 16, 'Río Chico'),
(199, 16, 'Mamporal'),
(200, 16, 'Guarenas'),
(201, 16, 'Cúpira'),
(202, 16, 'San José de Barlovento'),
(203, 16, 'San Francisco de Yare'),
(204, 16, 'Higuerote'),
(205, 16, 'Cúa'),
(206, 16, 'Guatire'),

-- Monagas (17)
(207, 17, 'Maturín'),
(208, 17, 'Caripe'),
(209, 17, 'Santa Bárbara'),
(210, 17, 'Aguasay'),
(211, 17, 'Temblador'),
(212, 17, 'Caicara de Maturín'),
(213, 17, 'Punta de Mata'),
(214, 17, 'Quiriquire'),
(215, 17, 'San Antonio de Capayacuar'),
(216, 17, 'Caripito'),
(217, 17, 'Aragua de Maturín'),
(218, 17, 'Barrancas del Orinoco'),
(219, 17, 'Uracoa'),

-- Nueva Esparta (18)
(220, 18, 'Porlamar'),
(221, 18, 'Juan Griego'),
(222, 18, 'La Asunción'),
(223, 18, 'Pampatar'),
(224, 18, 'Santa Ana'),
(225, 18, 'San Juan Bautista'),
(226, 18, 'Punta de Piedras'),
(227, 18, 'Los Robles'),
(228, 18, 'El Valle del Espíritu Santo'),
(229, 18, 'El Tigre'),
(230, 18, 'La Plaza de Paraguachí'),
(231, 18, 'Boca de Río'),
(232, 18, 'San Pedro de Coche'),

-- Portuguesa (19)
(233, 19, 'Guanare'),
(234, 19, 'Araure'),
(235, 19, 'Agua Blanca'),
(236, 19, 'Píritu'),
(237, 19, 'Guanarito'),
(238, 19, 'Ospino'),
(239, 19, 'Acarigua'),
(240, 19, 'Papelón'),
(241, 19, 'Boconoíto'),
(242, 19, 'Turén'),
(243, 19, 'Biscucuy'),
(244, 19, 'San Rafael de Onoto'),
(245, 19, 'Unda'),
(246, 19, 'El Playón'),

-- Sucre (20)
(247, 20, 'Carúpano'),
(248, 20, 'Cumaná'),
(249, 20, 'Araya'),
(250, 20, 'San José de Aerocual'),
(251, 20, 'Casanay'),
(252, 20, 'San Antonio del Golfo'),
(253, 20, 'Yaguaraparo'),
(254, 20, 'Cumanacoa'),
(255, 20, 'Marigüitar'),
(256, 20, 'Río Caribe'),
(257, 20, 'El Pilar'),
(258, 20, 'Tunapuy'),
(259, 20, 'Irapa'),
(260, 20, 'Cariaco'),
(261, 20, 'Güiria'),

-- Táchira (21)
(262, 21, 'San Cristóbal'),
(263, 21, 'San Rafael del Piñal'),
(264, 21, 'Colón'),
(265, 21, 'Táriba'),
(266, 21, 'Santa Ana del Táchira'),
(267, 21, 'Independencia'),
(268, 21, 'Palmira'),
(269, 21, 'Rubio'),
(270, 21, 'San José de Bolívar'),
(271, 21, 'Ureña'),
(272, 21, 'Cordero'),
(273, 21, 'Las Mesas'),
(274, 21, 'San Antonio del Táchira'),
(275, 21, 'La Fría'),
(276, 21, 'Capacho Nuevo'),
(277, 21, 'La Grita'),
(278, 21, 'El Cobre'),
(279, 21, 'Capacho Viejo'),
(280, 21, 'Abejales'),
(281, 21, 'Lobatera'),
(282, 21, 'Michelena'),
(283, 21, 'Coloncito'),
(284, 21, 'Delicias'),
(285, 21, 'La Tendida'),
(286, 21, 'Umuquena'),
(287, 21, 'Seboruco'),
(288, 21, 'San Simón'),
(289, 21, 'Queniquea'),
(290, 21, 'San Josecito'),
(291, 21, 'Pregonero'),

-- Trujillo (22)
(292, 22, 'Trujillo'),
(293, 22, 'Valera'),
(294, 22, 'Boconó'),
(295, 22, 'Sabana de Mendoza'),
(296, 22, 'Carache'),
(297, 22, 'Escuque'),
(298, 22, 'La Quebrada'),
(299, 22, 'Chejendé'),
(300, 22, 'El Dividive'),
(301, 22, 'Campo Elías'),
(302, 22, 'El Sombrero'),
(303, 22, 'Motatán'),
(304, 22, 'La Ceiba'),
(305, 22, 'Carvajal'),
(306, 22, 'Monay'),
(307, 22, 'Pampán'),
(308, 22, 'Pampanito'),
(309, 22, 'Betijoque'),
(310, 22, 'San Luis'),
(311, 22, 'Santa Isabel'),
(312, 22, 'Sabana Grande'),
(313, 22, 'Santa Apolonia'),
(314, 22, 'El Paradero'),
(315, 22, 'Monte Carmelo'),

-- Yaracuy (23)
(316, 23, 'San Felipe'),
(317, 23, 'Nirgua'),
(318, 23, 'Yaritagua'),
(319, 23, 'Cocorote'),
(320, 23, 'Chivacoa'),
(321, 23, 'Guama'),
(322, 23, 'Aroa'),
(323, 23, 'Sabana de Parra'),
(324, 23, 'Yumare'),
(325, 23, 'Farriar'),
(326, 23, 'Marín'),
(327, 23, 'Urachiche'),
(328, 23, 'Albarico'),
(329, 23, 'Independencia'),
(330, 23, 'San Pablo'),
(331, 23, 'Boraure'),

-- Zulia (24)
(332, 24, 'Maracaibo'),
(333, 24, 'Cabimas'),
(334, 24, 'Sinamaica'),
(335, 24, 'Carrasquero'),
(336, 24, 'San Francisco'),
(337, 24, 'Pueblo Nuevo'),
(338, 24, 'Santa Rita'),
(339, 24, 'San Carlos del Zulia'),
(340, 24, 'El Chivo'),
(341, 24, 'Machiques'),
(342, 24, 'La Concepción'),
(343, 24, 'Bachaquero'),
(344, 24, 'Mene Grande'),
(345, 24, 'La Villa del Rosario'),
(346, 24, 'Los Puertos de Altagracia'),
(347, 24, 'El Toro'),
(348, 24, 'San Timoteo'),
(349, 24, 'Encontrados'),
(350, 24, 'Casigua El Cubo'),
(351, 24, 'Concepción'),
(352, 24, 'Ciudad Ojeda'),
(353, 24, 'San Rafael del Moján'),
(354, 24, 'Tía Juana'),
(355, 24, 'Bobures')
;

-- Reset sequence
SELECT setval(pg_get_serial_sequence('ciudades', 'id'), 355);

-- ==========================================
-- 3. SECTORES (barrios / urbanizaciones)
-- ==========================================
INSERT INTO "sectores" ("id", "ciudad_id", "nombre") VALUES
-- Puerto Ayacucho (1)
(1, 1, 'El Platanal'),
(2, 1, 'La Isla'),
(3, 1, 'Las Brisas'),
(4, 1, 'Puerto Ayacucho Centro'),
(5, 1, 'Samariapo'),
-- La Esmeralda (2)
(6, 2, 'El Rosario'),
(7, 2, 'La Esmeralda Centro'),
(8, 2, 'Las Flores'),
-- San Fernando de Atabapo (3)
(9, 3, 'El Carmen'),
(10, 3, 'Los Mangos'),
(11, 3, 'San Fernando de Atabapo Centro'),
-- Isla Ratón (4)
(12, 4, 'Isla Ratón Centro'),
(13, 4, 'Las Palmas'),
(14, 4, 'San José'),
-- San Juan de Manapiare (5)
(15, 5, 'Bella Vista'),
(16, 5, 'San Antonio'),
(17, 5, 'San Juan de Manapiare Centro'),
-- Maroa (6)
(18, 6, 'La Concordia'),
(19, 6, 'Maroa Centro'),
(20, 6, 'San Miguel'),
-- San Carlos de Río Negro (7)
(21, 7, 'Pueblo Nuevo'),
(22, 7, 'San Carlos de Río Negro Centro'),
(23, 7, 'Santa Rosa'),
-- Anaco (8)
(24, 8, 'Anaco Centro'),
(25, 8, 'La Trinidad'),
(26, 8, 'Las Acacias'),
-- Barcelona (9)
(27, 9, 'Barcelona Centro'),
(28, 9, 'Brisas del Mar'),
(29, 9, 'Colinas de Barcelona'),
(30, 9, 'El Viñedo'),
(31, 9, 'La Redoma'),
(32, 9, 'Las Garzas'),
(33, 9, 'Puerto La Cruz Centro'),
(34, 9, 'Punta de Mata'),
-- Puerto La Cruz (10)
(35, 10, 'El Paraíso'),
(36, 10, 'El Samán'),
(37, 10, 'Puerto La Cruz Centro'),
-- Guanta (11)
(38, 11, 'Campo Lindo'),
(39, 11, 'Guanta Centro'),
(40, 11, 'La Floresta'),
-- El Tigre (12)
(41, 12, 'El Tigre Centro'),
(42, 12, 'Los Samanes'),
(43, 12, 'Santa Inés'),
-- Lechería (13)
(44, 13, 'El Morro'),
(45, 13, 'Laguna Real'),
(46, 13, 'Lechería Centro'),
(47, 13, 'Puerto Mochima'),
(48, 13, 'Villa del Mar'),
-- Pariaguán (14)
(49, 14, 'El Rosario'),
(50, 14, 'Las Flores'),
(51, 14, 'Pariaguán Centro'),
-- Clarines (15)
(52, 15, 'Clarines Centro'),
(53, 15, 'El Carmen'),
(54, 15, 'Los Mangos'),
-- Cantaura (16)
(55, 16, 'Cantaura Centro'),
(56, 16, 'Las Palmas'),
(57, 16, 'San José'),
-- Píritu (17)
(58, 17, 'Bella Vista'),
(59, 17, 'Píritu Centro'),
(60, 17, 'San Antonio'),
-- Aragua de Barcelona (18)
(61, 18, 'Aragua de Barcelona Centro'),
(62, 18, 'La Concordia'),
(63, 18, 'San Miguel'),
-- Onoto (19)
(64, 19, 'Onoto Centro'),
(65, 19, 'Pueblo Nuevo'),
(66, 19, 'Santa Rosa'),
-- Valle de Guanape (20)
(67, 20, 'La Trinidad'),
(68, 20, 'Las Acacias'),
(69, 20, 'Valle de Guanape Centro'),
-- San José de Guanipa (21)
(70, 21, 'El Paraíso'),
(71, 21, 'El Samán'),
(72, 21, 'San José de Guanipa Centro'),
-- Soledad (22)
(73, 22, 'Campo Lindo'),
(74, 22, 'La Floresta'),
(75, 22, 'Soledad Centro'),
-- San Mateo (23)
(76, 23, 'Los Samanes'),
(77, 23, 'San Mateo Centro'),
(78, 23, 'Santa Inés'),
-- El Chaparro (24)
(79, 24, 'El Chaparro Centro'),
(80, 24, 'El Rosario'),
(81, 24, 'Las Flores'),
-- Mapire (25)
(82, 25, 'El Carmen'),
(83, 25, 'Los Mangos'),
(84, 25, 'Mapire Centro'),
-- Boca de Uchire (26)
(85, 26, 'Boca de Uchire Centro'),
(86, 26, 'Las Palmas'),
(87, 26, 'San José'),
-- Santa Ana (27)
(88, 27, 'Bella Vista'),
(89, 27, 'San Antonio'),
(90, 27, 'Santa Ana Centro'),
-- Puerto Píritu (28)
(91, 28, 'La Concordia'),
(92, 28, 'Puerto Píritu Centro'),
(93, 28, 'San Miguel'),
-- San Fernando de Apure (29)
(94, 29, 'El Porvenir'),
(95, 29, 'La Concordia'),
(96, 29, 'Las Palmas'),
(97, 29, 'Mata de Caña'),
(98, 29, 'San Fernando Centro'),
-- Achaguas (30)
(99, 30, 'Achaguas Centro'),
(100, 30, 'Pueblo Nuevo'),
(101, 30, 'Santa Rosa'),
-- Biruaca (31)
(102, 31, 'Biruaca Centro'),
(103, 31, 'La Trinidad'),
(104, 31, 'Las Acacias'),
-- Bruzual (32)
(105, 32, 'Bruzual Centro'),
(106, 32, 'El Paraíso'),
(107, 32, 'El Samán'),
-- Guasdualito (33)
(108, 33, 'El Amparo'),
(109, 33, 'Guasdualito Centro'),
(110, 33, 'La Victoria'),
(111, 33, 'Santa Bárbara'),
-- Elorza (34)
(112, 34, 'Campo Lindo'),
(113, 34, 'Elorza Centro'),
(114, 34, 'La Floresta'),
-- San Juan de Payara (35)
(115, 35, 'Los Samanes'),
(116, 35, 'San Juan de Payara Centro'),
(117, 35, 'Santa Inés'),
-- Maracay (36)
(118, 36, 'Calicanto'),
(119, 36, 'Caña de Azúcar'),
(120, 36, 'La Cooperativa'),
(121, 36, 'La Floresta'),
(122, 36, 'La Soledad'),
(123, 36, 'Las Acacias'),
(124, 36, 'Palo Negro'),
(125, 36, 'San Jacinto'),
(126, 36, 'Santa Rosa'),
(127, 36, 'Urbanización El Castaño'),
-- Las Tejerías (37)
(128, 37, 'El Rosario'),
(129, 37, 'Las Flores'),
(130, 37, 'Las Tejerías Centro'),
-- La Victoria (38)
(131, 38, 'El Carmen'),
(132, 38, 'La Victoria Centro'),
(133, 38, 'Los Mangos'),
-- Villa de Cura (39)
(134, 39, 'Las Palmas'),
(135, 39, 'San José'),
(136, 39, 'Villa de Cura Centro'),
-- Turmero (40)
(137, 40, 'Bella Vista'),
(138, 40, 'San Antonio'),
(139, 40, 'Turmero Centro'),
-- San Mateo (41)
(140, 41, 'La Concordia'),
(141, 41, 'San Mateo Centro'),
(142, 41, 'San Miguel'),
-- Ocumare de la Costa (42)
(143, 42, 'Ocumare de la Costa Centro'),
(144, 42, 'Pueblo Nuevo'),
(145, 42, 'Santa Rosa'),
-- Barbacoas (43)
(146, 43, 'Barbacoas Centro'),
(147, 43, 'La Trinidad'),
(148, 43, 'Las Acacias'),
-- El Limón (44)
(149, 44, 'El Limón Centro'),
(150, 44, 'El Paraíso'),
(151, 44, 'El Samán'),
-- San Sebastián de los Reyes (45)
(152, 45, 'Campo Lindo'),
(153, 45, 'La Floresta'),
(154, 45, 'San Sebastián de los Reyes Centro'),
-- Cagua (46)
(155, 46, 'Cagua Centro'),
(156, 46, 'Los Samanes'),
(157, 46, 'Santa Inés'),
-- Colonia Tovar (47)
(158, 47, 'Colonia Tovar Centro'),
(159, 47, 'El Rosario'),
(160, 47, 'Las Flores'),
-- Santa Cruz (48)
(161, 48, 'El Carmen'),
(162, 48, 'Los Mangos'),
(163, 48, 'Santa Cruz Centro'),
-- Santa Rita (49)
(164, 49, 'Las Palmas'),
(165, 49, 'San José'),
(166, 49, 'Santa Rita Centro'),
-- Camatagua (50)
(167, 50, 'Bella Vista'),
(168, 50, 'Camatagua Centro'),
(169, 50, 'San Antonio'),
-- Palo Negro (51)
(170, 51, 'La Concordia'),
(171, 51, 'Palo Negro Centro'),
(172, 51, 'San Miguel'),
-- El Consejo (52)
(173, 52, 'El Consejo Centro'),
(174, 52, 'Pueblo Nuevo'),
(175, 52, 'Santa Rosa'),
-- San Casimiro (53)
(176, 53, 'La Trinidad'),
(177, 53, 'Las Acacias'),
(178, 53, 'San Casimiro Centro'),
-- Barinas (54)
(179, 54, 'Barinas Centro'),
(180, 54, 'Ciudad Tavacare'),
(181, 54, 'El Llanito'),
(182, 54, 'La Caramuca'),
(183, 54, 'Las Acacias'),
(184, 54, 'Punto Fresco'),
-- Sabaneta (55)
(185, 55, 'El Paraíso'),
(186, 55, 'El Samán'),
(187, 55, 'Sabaneta Centro'),
-- Barinitas (56)
(188, 56, 'Barinitas Centro'),
(189, 56, 'Campo Lindo'),
(190, 56, 'La Floresta'),
-- El Cantón (57)
(191, 57, 'El Cantón Centro'),
(192, 57, 'Los Samanes'),
(193, 57, 'Santa Inés'),
-- Arismendi (58)
(194, 58, 'Arismendi Centro'),
(195, 58, 'El Rosario'),
(196, 58, 'Las Flores'),
-- Santa Bárbara (59)
(197, 59, 'El Carmen'),
(198, 59, 'Los Mangos'),
(199, 59, 'Santa Bárbara Centro'),
-- Ciudad Bolivia (60)
(200, 60, 'Ciudad Bolivia Centro'),
(201, 60, 'Las Palmas'),
(202, 60, 'San José'),
-- Obispos (61)
(203, 61, 'Bella Vista'),
(204, 61, 'Obispos Centro'),
(205, 61, 'San Antonio'),
-- Ciudad de Pedraza (62)
(206, 62, 'Ciudad de Pedraza Centro'),
(207, 62, 'La Concordia'),
(208, 62, 'San Miguel'),
-- Libertad (63)
(209, 63, 'Libertad Centro'),
(210, 63, 'Pueblo Nuevo'),
(211, 63, 'Santa Rosa'),
-- Ciudad de Nutrias (64)
(212, 64, 'Ciudad de Nutrias Centro'),
(213, 64, 'La Trinidad'),
(214, 64, 'Las Acacias'),
-- Socopó (65)
(215, 65, 'El Paraíso'),
(216, 65, 'El Samán'),
(217, 65, 'Socopó Centro'),
-- Barrancas (66)
(218, 66, 'Barrancas Centro'),
(219, 66, 'Campo Lindo'),
(220, 66, 'La Floresta'),
-- Ciudad Guayana (Puerto Ordaz) (67)
(221, 67, 'Alta Vista'),
(222, 67, 'Castillito'),
(223, 67, 'Chilemex'),
(224, 67, 'Los Olivos'),
(225, 67, 'Unare'),
(226, 67, 'Villa Africana'),
-- San Félix (68)
(227, 68, 'Bella Vista'),
(228, 68, 'Matanzas'),
(229, 68, 'San Félix Centro'),
(230, 68, 'Villa Colombia'),
(231, 68, 'Vista al Sol'),
-- Ciudad Bolívar (69)
(232, 69, 'Alta Vista'),
(233, 69, 'Ciudad Bolívar Centro'),
(234, 69, 'El Perú'),
(235, 69, 'La Alameda'),
(236, 69, 'Las Delicias'),
(237, 69, 'Los Próceres'),
-- Ciudad Piar (70)
(238, 70, 'Ciudad Piar Centro'),
(239, 70, 'Los Samanes'),
(240, 70, 'Santa Inés'),
-- El Callao (71)
(241, 71, 'El Callao Centro'),
(242, 71, 'El Rosario'),
(243, 71, 'Las Flores'),
-- Santa Elena de Uairén (72)
(244, 72, 'El Carmen'),
(245, 72, 'Los Mangos'),
(246, 72, 'Santa Elena de Uairén Centro'),
-- Caicara del Orinoco (73)
(247, 73, 'Caicara del Orinoco Centro'),
(248, 73, 'Las Palmas'),
(249, 73, 'San José'),
-- Tumeremo (74)
(250, 74, 'Bella Vista'),
(251, 74, 'San Antonio'),
(252, 74, 'Tumeremo Centro'),
-- Maripa (75)
(253, 75, 'La Concordia'),
(254, 75, 'Maripa Centro'),
(255, 75, 'San Miguel'),
-- Upata (76)
(256, 76, 'Pueblo Nuevo'),
(257, 76, 'Santa Rosa'),
(258, 76, 'Upata Centro'),
-- El Palmar (77)
(259, 77, 'El Palmar Centro'),
(260, 77, 'La Trinidad'),
(261, 77, 'Las Acacias'),
-- Guasipati (78)
(262, 78, 'El Paraíso'),
(263, 78, 'El Samán'),
(264, 78, 'Guasipati Centro'),
-- El Dorado (79)
(265, 79, 'Campo Lindo'),
(266, 79, 'El Dorado Centro'),
(267, 79, 'La Floresta'),
-- Valencia (80)
(268, 80, 'Candelaria'),
(269, 80, 'El Trigal'),
(270, 80, 'La Isabelica'),
(271, 80, 'Las Viudas'),
(272, 80, 'Mañongo'),
(273, 80, 'Naguanagua'),
(274, 80, 'Prebo'),
(275, 80, 'San José de Tarbes'),
(276, 80, 'Urbanización La Viña'),
(277, 80, 'Vivienda Popular'),
-- Puerto Cabello (81)
(278, 81, 'Los Samanes'),
(279, 81, 'Puerto Cabello Centro'),
(280, 81, 'Santa Inés'),
-- Guacara (82)
(281, 82, 'El Rosario'),
(282, 82, 'Guacara Centro'),
(283, 82, 'Las Flores'),
-- San Diego (83)
(284, 83, 'El Carmen'),
(285, 83, 'Los Mangos'),
(286, 83, 'San Diego Centro'),
-- San Joaquín (84)
(287, 84, 'Las Palmas'),
(288, 84, 'San Joaquín Centro'),
(289, 84, 'San José'),
-- Naguanagua (85)
(290, 85, 'Bella Vista'),
(291, 85, 'Naguanagua Centro'),
(292, 85, 'San Antonio'),
-- Los Guayos (86)
(293, 86, 'La Concordia'),
(294, 86, 'Los Guayos Centro'),
(295, 86, 'San Miguel'),
-- Bejuma (87)
(296, 87, 'Bejuma Centro'),
(297, 87, 'Pueblo Nuevo'),
(298, 87, 'Santa Rosa'),
-- Mariara (88)
(299, 88, 'La Trinidad'),
(300, 88, 'Las Acacias'),
(301, 88, 'Mariara Centro'),
-- Miranda (89)
(302, 89, 'El Paraíso'),
(303, 89, 'El Samán'),
(304, 89, 'Miranda Centro'),
-- Morón (90)
(305, 90, 'Campo Lindo'),
(306, 90, 'La Floresta'),
(307, 90, 'Morón Centro'),
-- Montalbán (91)
(308, 91, 'Los Samanes'),
(309, 91, 'Montalbán Centro'),
(310, 91, 'Santa Inés'),
-- Güigüe (92)
(311, 92, 'El Rosario'),
(312, 92, 'Güigüe Centro'),
(313, 92, 'Las Flores'),
-- Tocuyito (93)
(314, 93, 'El Carmen'),
(315, 93, 'Los Mangos'),
(316, 93, 'Tocuyito Centro'),
-- San Carlos (94)
(317, 94, 'Las Palmas'),
(318, 94, 'San Carlos Centro'),
(319, 94, 'San José'),
-- Cojedes (95)
(320, 95, 'Bella Vista'),
(321, 95, 'Cojedes Centro'),
(322, 95, 'San Antonio'),
-- Tinaquillo (96)
(323, 96, 'El Carmen'),
(324, 96, 'La Cortina'),
(325, 96, 'La Victoria'),
(326, 96, 'Las Flores'),
(327, 96, 'Tinaquillo Centro'),
-- El Baúl (97)
(328, 97, 'El Baúl Centro'),
(329, 97, 'La Concordia'),
(330, 97, 'San Miguel'),
-- Macapo (98)
(331, 98, 'Macapo Centro'),
(332, 98, 'Pueblo Nuevo'),
(333, 98, 'Santa Rosa'),
-- El Pao (99)
(334, 99, 'El Pao Centro'),
(335, 99, 'La Trinidad'),
(336, 99, 'Las Acacias'),
-- Libertad (100)
(337, 100, 'El Paraíso'),
(338, 100, 'El Samán'),
(339, 100, 'Libertad Centro'),
-- Las Vegas (101)
(340, 101, 'Campo Lindo'),
(341, 101, 'La Floresta'),
(342, 101, 'Las Vegas Centro'),
-- Tinaco (102)
(343, 102, 'Los Samanes'),
(344, 102, 'Santa Inés'),
(345, 102, 'Tinaco Centro'),
-- Tucupita (103)
(346, 103, 'El Chico'),
(347, 103, 'La Florida'),
(348, 103, 'San José'),
(349, 103, 'San Rafael'),
(350, 103, 'Tucupita Centro'),
-- Curiapo (104)
(351, 104, 'Curiapo Centro'),
(352, 104, 'El Rosario'),
(353, 104, 'Las Flores'),
-- Sierra Imataca (105)
(354, 105, 'El Carmen'),
(355, 105, 'Los Mangos'),
(356, 105, 'Sierra Imataca Centro'),
-- Pedernales (106)
(357, 106, 'Las Palmas'),
(358, 106, 'Pedernales Centro'),
(359, 106, 'San José'),
-- Caracas (107)
(360, 107, 'Altamira'),
(361, 107, 'Antímano'),
(362, 107, 'Caricuao'),
(363, 107, 'Catia'),
(364, 107, 'Colinas de Bello Monte'),
(365, 107, 'Country Club'),
(366, 107, 'El Cafetal'),
(367, 107, 'El Paraíso'),
(368, 107, 'El Silencio'),
(369, 107, 'El Valle'),
(370, 107, 'La Candelaria'),
(371, 107, 'La Castellana'),
(372, 107, 'Las Mercedes'),
(373, 107, 'Los Chaguaramos'),
(374, 107, 'Los Rosales'),
(375, 107, 'Prados del Este'),
(376, 107, 'Sabana Grande'),
(377, 107, 'San Bernardino'),
(378, 107, 'Santa Mónica'),
-- Punto Fijo (108)
(379, 108, 'La Bordonesa'),
(380, 108, 'Las Piedras'),
(381, 108, 'Los Cactus'),
(382, 108, 'Punto Fijo Centro'),
(383, 108, 'Santa Fe'),
-- San Juan de los Cayos (109)
(384, 109, 'Bella Vista'),
(385, 109, 'San Antonio'),
(386, 109, 'San Juan de los Cayos Centro'),
-- Coro (110)
(387, 110, 'Coro Centro'),
(388, 110, 'El Cardón'),
(389, 110, 'La Vela'),
(390, 110, 'Los Verdes'),
(391, 110, 'Pueblo Nuevo'),
-- Los Taques (111)
(392, 111, 'La Concordia'),
(393, 111, 'Los Taques Centro'),
(394, 111, 'San Miguel'),
-- Las Piedras (112)
(395, 112, 'Las Piedras Centro'),
(396, 112, 'Pueblo Nuevo'),
(397, 112, 'Santa Rosa'),
-- Chichiriviche (113)
(398, 113, 'Chichiriviche Centro'),
(399, 113, 'La Trinidad'),
(400, 113, 'Las Acacias'),
-- Buchivacoa (114)
(401, 114, 'Buchivacoa Centro'),
(402, 114, 'El Paraíso'),
(403, 114, 'El Samán'),
-- Tucacas (115)
(404, 115, 'Campo Lindo'),
(405, 115, 'La Floresta'),
(406, 115, 'Tucacas Centro'),
-- Mirimire (116)
(407, 116, 'Los Samanes'),
(408, 116, 'Mirimire Centro'),
(409, 116, 'Santa Inés'),
-- Dabajuro (117)
(410, 117, 'Dabajuro Centro'),
(411, 117, 'El Rosario'),
(412, 117, 'Las Flores'),
-- Mene de Mauroa (118)
(413, 118, 'El Carmen'),
(414, 118, 'Los Mangos'),
(415, 118, 'Mene de Mauroa Centro'),
-- Pedregal (119)
(416, 119, 'Las Palmas'),
(417, 119, 'Pedregal Centro'),
(418, 119, 'San José'),
-- Palmasola (120)
(419, 120, 'Bella Vista'),
(420, 120, 'Palmasola Centro'),
(421, 120, 'San Antonio'),
-- Píritu (121)
(422, 121, 'La Concordia'),
(423, 121, 'Píritu Centro'),
(424, 121, 'San Miguel'),
-- Tocópero (122)
(425, 122, 'Pueblo Nuevo'),
(426, 122, 'Santa Rosa'),
(427, 122, 'Tocópero Centro'),
-- Puerto Cumarebo (123)
(428, 123, 'La Trinidad'),
(429, 123, 'Las Acacias'),
(430, 123, 'Puerto Cumarebo Centro'),
-- San Luis (124)
(431, 124, 'El Paraíso'),
(432, 124, 'El Samán'),
(433, 124, 'San Luis Centro'),
-- Capatárida (125)
(434, 125, 'Campo Lindo'),
(435, 125, 'Capatárida Centro'),
(436, 125, 'La Floresta'),
-- La Vela de Coro (126)
(437, 126, 'La Vela de Coro Centro'),
(438, 126, 'Los Samanes'),
(439, 126, 'Santa Inés'),
-- Churuguara (127)
(440, 127, 'Churuguara Centro'),
(441, 127, 'El Rosario'),
(442, 127, 'Las Flores'),
-- Jacura (128)
(443, 128, 'El Carmen'),
(444, 128, 'Jacura Centro'),
(445, 128, 'Los Mangos'),
-- Yaracal (129)
(446, 129, 'Las Palmas'),
(447, 129, 'San José'),
(448, 129, 'Yaracal Centro'),
-- Santa Ana de Coro (130)
(449, 130, 'Bella Vista'),
(450, 130, 'San Antonio'),
(451, 130, 'Santa Ana de Coro Centro'),
-- Cabure (131)
(452, 131, 'Cabure Centro'),
(453, 131, 'La Concordia'),
(454, 131, 'San Miguel'),
-- La Cruz de Taratara (132)
(455, 132, 'La Cruz de Taratara Centro'),
(456, 132, 'Pueblo Nuevo'),
(457, 132, 'Santa Rosa'),
-- Santa Cruz de Bucaral (133)
(458, 133, 'La Trinidad'),
(459, 133, 'Las Acacias'),
(460, 133, 'Santa Cruz de Bucaral Centro'),
-- Urumaco (134)
(461, 134, 'El Paraíso'),
(462, 134, 'El Samán'),
(463, 134, 'Urumaco Centro'),
-- Camaguán (135)
(464, 135, 'Camaguán Centro'),
(465, 135, 'Campo Lindo'),
(466, 135, 'La Floresta'),
-- Altagracia de Orituco (136)
(467, 136, 'Altagracia de Orituco Centro'),
(468, 136, 'Los Samanes'),
(469, 136, 'Santa Inés'),
-- El Socorro (137)
(470, 137, 'El Rosario'),
(471, 137, 'El Socorro Centro'),
(472, 137, 'Las Flores'),
-- Valle de la Pascua (138)
(473, 138, 'El Rosario'),
(474, 138, 'La Esperanza'),
(475, 138, 'La Trinidad'),
(476, 138, 'Las Garzas'),
(477, 138, 'Valle de la Pascua Centro'),
-- Las Mercedes (139)
(478, 139, 'El Carmen'),
(479, 139, 'Las Mercedes Centro'),
(480, 139, 'Los Mangos'),
-- Calabozo (140)
(481, 140, 'Calabozo Centro'),
(482, 140, 'Ciudadela'),
(483, 140, 'Las Mercedes'),
(484, 140, 'Los Apamates'),
(485, 140, 'San José'),
-- San Gerónimo de Guayabal (141)
(486, 141, 'Las Palmas'),
(487, 141, 'San Gerónimo de Guayabal Centro'),
(488, 141, 'San José'),
-- Zaraza (142)
(489, 142, 'Bella Vista'),
(490, 142, 'San Antonio'),
(491, 142, 'Zaraza Centro'),
-- Santa María de Ipire (143)
(492, 143, 'La Concordia'),
(493, 143, 'San Miguel'),
(494, 143, 'Santa María de Ipire Centro'),
-- Chaguaramas (144)
(495, 144, 'Chaguaramas Centro'),
(496, 144, 'Pueblo Nuevo'),
(497, 144, 'Santa Rosa'),
-- Ortíz (145)
(498, 145, 'La Trinidad'),
(499, 145, 'Las Acacias'),
(500, 145, 'Ortíz Centro'),
-- San José de Guaribe (146)
(501, 146, 'El Paraíso'),
(502, 146, 'El Samán'),
(503, 146, 'San José de Guaribe Centro'),
-- Tucupido (147)
(504, 147, 'Campo Lindo'),
(505, 147, 'La Floresta'),
(506, 147, 'Tucupido Centro'),
-- San Juan de los Morros (148)
(507, 148, 'Los Samanes'),
(508, 148, 'San Juan de los Morros Centro'),
(509, 148, 'Santa Inés'),
-- El Sombrero (149)
(510, 149, 'El Rosario'),
(511, 149, 'El Sombrero Centro'),
(512, 149, 'Las Flores'),
-- Barquisimeto (150)
(513, 150, 'Barrio Unión'),
(514, 150, 'Cabudare'),
(515, 150, 'El Cercado'),
(516, 150, 'El Manzano'),
(517, 150, 'La Carucieña'),
(518, 150, 'La Piedad'),
(519, 150, 'Las Trinitarias'),
(520, 150, 'Los Rastrojos'),
(521, 150, 'Obelisco'),
(522, 150, 'Santa Rosa'),
-- Quíbor (151)
(523, 151, 'El Carmen'),
(524, 151, 'Los Mangos'),
(525, 151, 'Quíbor Centro'),
-- Cabudare (152)
(526, 152, 'Cabudare Centro'),
(527, 152, 'Las Palmas'),
(528, 152, 'San José'),
-- El Tocuyo (153)
(529, 153, 'Bella Vista'),
(530, 153, 'El Tocuyo Centro'),
(531, 153, 'San Antonio'),
-- Carora (154)
(532, 154, 'Carora Centro'),
(533, 154, 'La Concordia'),
(534, 154, 'San Miguel'),
-- Siquisique (155)
(535, 155, 'Pueblo Nuevo'),
(536, 155, 'Santa Rosa'),
(537, 155, 'Siquisique Centro'),
-- Sanare (156)
(538, 156, 'La Trinidad'),
(539, 156, 'Las Acacias'),
(540, 156, 'Sanare Centro'),
-- Sarare (157)
(541, 157, 'El Paraíso'),
(542, 157, 'El Samán'),
(543, 157, 'Sarare Centro'),
-- Duaca (158)
(544, 158, 'Campo Lindo'),
(545, 158, 'Duaca Centro'),
(546, 158, 'La Floresta'),
-- Maiquetía (159)
(547, 159, 'Los Samanes'),
(548, 159, 'Maiquetía Centro'),
(549, 159, 'Santa Inés'),
-- La Guaira (160)
(550, 160, 'El Rosario'),
(551, 160, 'La Guaira Centro'),
(552, 160, 'Las Flores'),
-- Macuto (161)
(553, 161, 'El Carmen'),
(554, 161, 'Los Mangos'),
(555, 161, 'Macuto Centro'),
-- Catia La Mar (162)
(556, 162, 'Catia La Mar Centro'),
(557, 162, 'Las Palmas'),
(558, 162, 'San José'),
-- Mérida (163)
(559, 163, 'El Arenal'),
(560, 163, 'El Llano'),
(561, 163, 'La Hoyada'),
(562, 163, 'La Mucuy'),
(563, 163, 'Los Llanitos'),
(564, 163, 'Pueblo Nuevo'),
(565, 163, 'Santa Elena'),
(566, 163, 'Santa María'),
-- El Vigía (164)
(567, 164, 'El Guayabón'),
(568, 164, 'El Vigía Centro'),
(569, 164, 'La Ciruelera'),
(570, 164, 'La Pedregosa'),
(571, 164, 'San Carlos'),
-- Mucuchíes (165)
(572, 165, 'Bella Vista'),
(573, 165, 'Mucuchíes Centro'),
(574, 165, 'San Antonio'),
-- Tovar (166)
(575, 166, 'La Concordia'),
(576, 166, 'San Miguel'),
(577, 166, 'Tovar Centro'),
-- Nueva Bolivia (167)
(578, 167, 'Nueva Bolivia Centro'),
(579, 167, 'Pueblo Nuevo'),
(580, 167, 'Santa Rosa'),
-- Bailadores (168)
(581, 168, 'Bailadores Centro'),
(582, 168, 'La Trinidad'),
(583, 168, 'Las Acacias'),
-- Santa Elena de Arenales (169)
(584, 169, 'El Paraíso'),
(585, 169, 'El Samán'),
(586, 169, 'Santa Elena de Arenales Centro'),
-- Pueblo Llano (170)
(587, 170, 'Campo Lindo'),
(588, 170, 'La Floresta'),
(589, 170, 'Pueblo Llano Centro'),
-- Santo Domingo (171)
(590, 171, 'Los Samanes'),
(591, 171, 'Santa Inés'),
(592, 171, 'Santo Domingo Centro'),
-- La Azulita (172)
(593, 172, 'El Rosario'),
(594, 172, 'La Azulita Centro'),
(595, 172, 'Las Flores'),
-- Santa Cruz de Mora (173)
(596, 173, 'El Carmen'),
(597, 173, 'Los Mangos'),
(598, 173, 'Santa Cruz de Mora Centro'),
-- Aricagua (174)
(599, 174, 'Aricagua Centro'),
(600, 174, 'Las Palmas'),
(601, 174, 'San José'),
-- Canaguá (175)
(602, 175, 'Bella Vista'),
(603, 175, 'Canaguá Centro'),
(604, 175, 'San Antonio'),
-- Ejido (176)
(605, 176, 'Ejido Centro'),
(606, 176, 'La Concordia'),
(607, 176, 'San Miguel'),
-- Tucaní (177)
(608, 177, 'Pueblo Nuevo'),
(609, 177, 'Santa Rosa'),
(610, 177, 'Tucaní Centro'),
-- Guaraque (178)
(611, 178, 'Guaraque Centro'),
(612, 178, 'La Trinidad'),
(613, 178, 'Las Acacias'),
-- Arapuey (179)
(614, 179, 'Arapuey Centro'),
(615, 179, 'El Paraíso'),
(616, 179, 'El Samán'),
-- Torondoy (180)
(617, 180, 'Campo Lindo'),
(618, 180, 'La Floresta'),
(619, 180, 'Torondoy Centro'),
-- Timotes (181)
(620, 181, 'Los Samanes'),
(621, 181, 'Santa Inés'),
(622, 181, 'Timotes Centro'),
-- Santa María de Caparo (182)
(623, 182, 'El Rosario'),
(624, 182, 'Las Flores'),
(625, 182, 'Santa María de Caparo Centro'),
-- Tabay (183)
(626, 183, 'El Carmen'),
(627, 183, 'Los Mangos'),
(628, 183, 'Tabay Centro'),
-- Lagunillas (184)
(629, 184, 'Lagunillas Centro'),
(630, 184, 'Las Palmas'),
(631, 184, 'San José'),
-- Zea (185)
(632, 185, 'Bella Vista'),
(633, 185, 'San Antonio'),
(634, 185, 'Zea Centro'),
-- Baruta (186)
(635, 186, 'Baruta'),
(636, 186, 'El Guapo'),
(637, 186, 'La Trinidad'),
(638, 186, 'Las Minitas'),
(639, 186, 'Prados del Sur'),
(640, 186, 'Santa Rosa de Lima'),
-- Chacao (187)
(641, 187, 'Chacao Centro'),
(642, 187, 'La Concordia'),
(643, 187, 'San Miguel'),
-- El Hatillo (188)
(644, 188, 'El Hatillo Centro'),
(645, 188, 'Pueblo Nuevo'),
(646, 188, 'Santa Rosa'),
-- Petare (189)
(647, 189, 'Boleíta'),
(648, 189, 'Horizonte'),
(649, 189, 'La California'),
(650, 189, 'La Urbina'),
(651, 189, 'Los Cortijos'),
(652, 189, 'Los Dos Caminos'),
(653, 189, 'Los Palos Grandes'),
(654, 189, 'Los Samanes'),
-- Carrizal (190)
(655, 190, 'Carrizal Centro'),
(656, 190, 'La Trinidad'),
(657, 190, 'Las Acacias'),
-- Charallave (191)
(658, 191, 'Charallave Centro'),
(659, 191, 'El Paraíso'),
(660, 191, 'El Samán'),
-- Los Teques (192)
(661, 192, 'El Paso'),
(662, 192, 'La Matica'),
(663, 192, 'Laguneta'),
(664, 192, 'Los Teques Centro'),
(665, 192, 'San Agustín del Sur'),
-- San Antonio de los Altos (193)
(666, 193, 'Campo Lindo'),
(667, 193, 'La Floresta'),
(668, 193, 'San Antonio de los Altos Centro'),
-- Ocumare del Tuy (194)
(669, 194, 'Los Samanes'),
(670, 194, 'Ocumare del Tuy Centro'),
(671, 194, 'Santa Inés'),
-- Santa Lucía (195)
(672, 195, 'El Rosario'),
(673, 195, 'Las Flores'),
(674, 195, 'Santa Lucía Centro'),
-- Santa Teresa del Tuy (196)
(675, 196, 'El Carmen'),
(676, 196, 'Los Mangos'),
(677, 196, 'Santa Teresa del Tuy Centro'),
-- Caucagua (197)
(678, 197, 'Caucagua Centro'),
(679, 197, 'Las Palmas'),
(680, 197, 'San José'),
-- Río Chico (198)
(681, 198, 'Bella Vista'),
(682, 198, 'Río Chico Centro'),
(683, 198, 'San Antonio'),
-- Mamporal (199)
(684, 199, 'La Concordia'),
(685, 199, 'Mamporal Centro'),
(686, 199, 'San Miguel'),
-- Guarenas (200)
(687, 200, 'Guarenas Centro'),
(688, 200, 'Pueblo Nuevo'),
(689, 200, 'Santa Rosa'),
-- Cúpira (201)
(690, 201, 'Cúpira Centro'),
(691, 201, 'La Trinidad'),
(692, 201, 'Las Acacias'),
-- San José de Barlovento (202)
(693, 202, 'El Paraíso'),
(694, 202, 'El Samán'),
(695, 202, 'San José de Barlovento Centro'),
-- San Francisco de Yare (203)
(696, 203, 'Campo Lindo'),
(697, 203, 'La Floresta'),
(698, 203, 'San Francisco de Yare Centro'),
-- Higuerote (204)
(699, 204, 'Higuerote Centro'),
(700, 204, 'Los Samanes'),
(701, 204, 'Santa Inés'),
-- Cúa (205)
(702, 205, 'Cúa Centro'),
(703, 205, 'El Rosario'),
(704, 205, 'Las Flores'),
-- Guatire (206)
(705, 206, 'El Carmen'),
(706, 206, 'Guatire Centro'),
(707, 206, 'Los Mangos'),
-- Maturín (207)
(708, 207, 'Alto de los Godos'),
(709, 207, 'La Cruz'),
(710, 207, 'La Puente'),
(711, 207, 'Las Cocuizas'),
(712, 207, 'Los Godos'),
(713, 207, 'Santa Inés'),
-- Caripe (208)
(714, 208, 'Caripe Centro'),
(715, 208, 'Las Palmas'),
(716, 208, 'San José'),
-- Santa Bárbara (209)
(717, 209, 'Bella Vista'),
(718, 209, 'San Antonio'),
(719, 209, 'Santa Bárbara Centro'),
-- Aguasay (210)
(720, 210, 'Aguasay Centro'),
(721, 210, 'La Concordia'),
(722, 210, 'San Miguel'),
-- Temblador (211)
(723, 211, 'Pueblo Nuevo'),
(724, 211, 'Santa Rosa'),
(725, 211, 'Temblador Centro'),
-- Caicara de Maturín (212)
(726, 212, 'Caicara de Maturín Centro'),
(727, 212, 'La Trinidad'),
(728, 212, 'Las Acacias'),
-- Punta de Mata (213)
(729, 213, 'El Paraíso'),
(730, 213, 'El Samán'),
(731, 213, 'Punta de Mata Centro'),
-- Quiriquire (214)
(732, 214, 'Campo Lindo'),
(733, 214, 'La Floresta'),
(734, 214, 'Quiriquire Centro'),
-- San Antonio de Capayacuar (215)
(735, 215, 'Los Samanes'),
(736, 215, 'San Antonio de Capayacuar Centro'),
(737, 215, 'Santa Inés'),
-- Caripito (216)
(738, 216, 'Caripito Centro'),
(739, 216, 'El Rosario'),
(740, 216, 'Las Flores'),
-- Aragua de Maturín (217)
(741, 217, 'Aragua de Maturín Centro'),
(742, 217, 'El Carmen'),
(743, 217, 'Los Mangos'),
-- Barrancas del Orinoco (218)
(744, 218, 'Barrancas del Orinoco Centro'),
(745, 218, 'Las Palmas'),
(746, 218, 'San José'),
-- Uracoa (219)
(747, 219, 'Bella Vista'),
(748, 219, 'San Antonio'),
(749, 219, 'Uracoa Centro'),
-- Porlamar (220)
(750, 220, 'Bella Vista'),
(751, 220, 'El Poblado'),
(752, 220, 'Gaspar Marcano'),
(753, 220, 'La Arboleda'),
(754, 220, 'Los Cocos'),
(755, 220, 'Porlamar Centro'),
-- Juan Griego (221)
(756, 221, 'Juan Griego Centro'),
(757, 221, 'La Concordia'),
(758, 221, 'San Miguel'),
-- La Asunción (222)
(759, 222, 'La Asunción Centro'),
(760, 222, 'Pueblo Nuevo'),
(761, 222, 'Santa Rosa'),
-- Pampatar (223)
(762, 223, 'La Trinidad'),
(763, 223, 'Las Acacias'),
(764, 223, 'Pampatar Centro'),
-- Santa Ana (224)
(765, 224, 'El Paraíso'),
(766, 224, 'El Samán'),
(767, 224, 'Santa Ana Centro'),
-- San Juan Bautista (225)
(768, 225, 'Campo Lindo'),
(769, 225, 'La Floresta'),
(770, 225, 'San Juan Bautista Centro'),
-- Punta de Piedras (226)
(771, 226, 'Los Samanes'),
(772, 226, 'Punta de Piedras Centro'),
(773, 226, 'Santa Inés'),
-- Los Robles (227)
(774, 227, 'El Rosario'),
(775, 227, 'Las Flores'),
(776, 227, 'Los Robles Centro'),
-- El Valle del Espíritu Santo (228)
(777, 228, 'El Carmen'),
(778, 228, 'El Valle del Espíritu Santo Centro'),
(779, 228, 'Los Mangos'),
-- El Tigre (229)
(780, 229, 'El Tigre Centro'),
(781, 229, 'Las Palmas'),
(782, 229, 'San José'),
-- La Plaza de Paraguachí (230)
(783, 230, 'Bella Vista'),
(784, 230, 'La Plaza de Paraguachí Centro'),
(785, 230, 'San Antonio'),
-- Boca de Río (231)
(786, 231, 'Boca de Río Centro'),
(787, 231, 'La Concordia'),
(788, 231, 'San Miguel'),
-- San Pedro de Coche (232)
(789, 232, 'Pueblo Nuevo'),
(790, 232, 'San Pedro de Coche Centro'),
(791, 232, 'Santa Rosa'),
-- Guanare (233)
(792, 233, 'Guanare Centro'),
(793, 233, 'La Coromoto'),
(794, 233, 'La Gallera'),
(795, 233, 'Las Palmas'),
(796, 233, 'Santa Teresita'),
-- Araure (234)
(797, 234, 'Araure Centro'),
(798, 234, 'La Trinidad'),
(799, 234, 'Las Acacias'),
-- Agua Blanca (235)
(800, 235, 'Agua Blanca Centro'),
(801, 235, 'El Paraíso'),
(802, 235, 'El Samán'),
-- Píritu (236)
(803, 236, 'Campo Lindo'),
(804, 236, 'La Floresta'),
(805, 236, 'Píritu Centro'),
-- Guanarito (237)
(806, 237, 'Guanarito Centro'),
(807, 237, 'Los Samanes'),
(808, 237, 'Santa Inés'),
-- Ospino (238)
(809, 238, 'El Rosario'),
(810, 238, 'Las Flores'),
(811, 238, 'Ospino Centro'),
-- Acarigua (239)
(812, 239, 'Acarigua Centro'),
(813, 239, 'El Poblado'),
(814, 239, 'La Avenida'),
(815, 239, 'Las Américas'),
(816, 239, 'Villa Hermosa'),
-- Papelón (240)
(817, 240, 'El Carmen'),
(818, 240, 'Los Mangos'),
(819, 240, 'Papelón Centro'),
-- Boconoíto (241)
(820, 241, 'Boconoíto Centro'),
(821, 241, 'Las Palmas'),
(822, 241, 'San José'),
-- Turén (242)
(823, 242, 'Bella Vista'),
(824, 242, 'San Antonio'),
(825, 242, 'Turén Centro'),
-- Biscucuy (243)
(826, 243, 'Biscucuy Centro'),
(827, 243, 'La Concordia'),
(828, 243, 'San Miguel'),
-- San Rafael de Onoto (244)
(829, 244, 'Pueblo Nuevo'),
(830, 244, 'San Rafael de Onoto Centro'),
(831, 244, 'Santa Rosa'),
-- Unda (245)
(832, 245, 'La Trinidad'),
(833, 245, 'Las Acacias'),
(834, 245, 'Unda Centro'),
-- El Playón (246)
(835, 246, 'El Paraíso'),
(836, 246, 'El Playón Centro'),
(837, 246, 'El Samán'),
-- Carúpano (247)
(838, 247, 'Buenos Aires'),
(839, 247, 'Carúpano Centro'),
(840, 247, 'La Divina Pastora'),
(841, 247, 'Los Cedros'),
(842, 247, 'Playa Grande'),
-- Cumaná (248)
(843, 248, 'Cumaná Centro'),
(844, 248, 'El Peñón'),
(845, 248, 'La Llanada'),
(846, 248, 'Las Palmas'),
(847, 248, 'San Luis'),
(848, 248, 'Valle Verde'),
-- Araya (249)
(849, 249, 'Araya Centro'),
(850, 249, 'Campo Lindo'),
(851, 249, 'La Floresta'),
-- San José de Aerocual (250)
(852, 250, 'Los Samanes'),
(853, 250, 'San José de Aerocual Centro'),
(854, 250, 'Santa Inés'),
-- Casanay (251)
(855, 251, 'Casanay Centro'),
(856, 251, 'El Rosario'),
(857, 251, 'Las Flores'),
-- San Antonio del Golfo (252)
(858, 252, 'El Carmen'),
(859, 252, 'Los Mangos'),
(860, 252, 'San Antonio del Golfo Centro'),
-- Yaguaraparo (253)
(861, 253, 'Las Palmas'),
(862, 253, 'San José'),
(863, 253, 'Yaguaraparo Centro'),
-- Cumanacoa (254)
(864, 254, 'Bella Vista'),
(865, 254, 'Cumanacoa Centro'),
(866, 254, 'San Antonio'),
-- Marigüitar (255)
(867, 255, 'La Concordia'),
(868, 255, 'Marigüitar Centro'),
(869, 255, 'San Miguel'),
-- Río Caribe (256)
(870, 256, 'Pueblo Nuevo'),
(871, 256, 'Río Caribe Centro'),
(872, 256, 'Santa Rosa'),
-- El Pilar (257)
(873, 257, 'El Pilar Centro'),
(874, 257, 'La Trinidad'),
(875, 257, 'Las Acacias'),
-- Tunapuy (258)
(876, 258, 'El Paraíso'),
(877, 258, 'El Samán'),
(878, 258, 'Tunapuy Centro'),
-- Irapa (259)
(879, 259, 'Campo Lindo'),
(880, 259, 'Irapa Centro'),
(881, 259, 'La Floresta'),
-- Cariaco (260)
(882, 260, 'Cariaco Centro'),
(883, 260, 'Los Samanes'),
(884, 260, 'Santa Inés'),
-- Güiria (261)
(885, 261, 'El Rosario'),
(886, 261, 'Güiria Centro'),
(887, 261, 'Las Flores'),
-- San Cristóbal (262)
(888, 262, 'Barrio Obrero'),
(889, 262, 'El Mirador'),
(890, 262, 'La Concordia'),
(891, 262, 'Los Naranjos'),
(892, 262, 'Piñango'),
(893, 262, 'San Carlos'),
(894, 262, 'Santa Teresa'),
(895, 262, 'Sierra Nevada'),
-- San Rafael del Piñal (263)
(896, 263, 'El Carmen'),
(897, 263, 'Los Mangos'),
(898, 263, 'San Rafael del Piñal Centro'),
-- Colón (264)
(899, 264, 'Colón Centro'),
(900, 264, 'Las Palmas'),
(901, 264, 'San José'),
-- Táriba (265)
(902, 265, 'Bella Vista'),
(903, 265, 'San Antonio'),
(904, 265, 'Táriba Centro'),
-- Santa Ana del Táchira (266)
(905, 266, 'La Concordia'),
(906, 266, 'San Miguel'),
(907, 266, 'Santa Ana del Táchira Centro'),
-- Independencia (267)
(908, 267, 'Independencia Centro'),
(909, 267, 'Pueblo Nuevo'),
(910, 267, 'Santa Rosa'),
-- Palmira (268)
(911, 268, 'La Trinidad'),
(912, 268, 'Las Acacias'),
(913, 268, 'Palmira Centro'),
-- Rubio (269)
(914, 269, 'El Paraíso'),
(915, 269, 'El Samán'),
(916, 269, 'Rubio Centro'),
-- San José de Bolívar (270)
(917, 270, 'Campo Lindo'),
(918, 270, 'La Floresta'),
(919, 270, 'San José de Bolívar Centro'),
-- Ureña (271)
(920, 271, 'Los Samanes'),
(921, 271, 'Santa Inés'),
(922, 271, 'Ureña Centro'),
-- Cordero (272)
(923, 272, 'Cordero Centro'),
(924, 272, 'El Rosario'),
(925, 272, 'Las Flores'),
-- Las Mesas (273)
(926, 273, 'El Carmen'),
(927, 273, 'Las Mesas Centro'),
(928, 273, 'Los Mangos'),
-- San Antonio del Táchira (274)
(929, 274, 'Las Palmas'),
(930, 274, 'San Antonio del Táchira Centro'),
(931, 274, 'San José'),
-- La Fría (275)
(932, 275, 'Bella Vista'),
(933, 275, 'La Fría Centro'),
(934, 275, 'San Antonio'),
-- Capacho Nuevo (276)
(935, 276, 'Capacho Nuevo Centro'),
(936, 276, 'La Concordia'),
(937, 276, 'San Miguel'),
-- La Grita (277)
(938, 277, 'La Grita Centro'),
(939, 277, 'Pueblo Nuevo'),
(940, 277, 'Santa Rosa'),
-- El Cobre (278)
(941, 278, 'El Cobre Centro'),
(942, 278, 'La Trinidad'),
(943, 278, 'Las Acacias'),
-- Capacho Viejo (279)
(944, 279, 'Capacho Viejo Centro'),
(945, 279, 'El Paraíso'),
(946, 279, 'El Samán'),
-- Abejales (280)
(947, 280, 'Abejales Centro'),
(948, 280, 'Campo Lindo'),
(949, 280, 'La Floresta'),
-- Lobatera (281)
(950, 281, 'Lobatera Centro'),
(951, 281, 'Los Samanes'),
(952, 281, 'Santa Inés'),
-- Michelena (282)
(953, 282, 'El Rosario'),
(954, 282, 'Las Flores'),
(955, 282, 'Michelena Centro'),
-- Coloncito (283)
(956, 283, 'Coloncito Centro'),
(957, 283, 'El Carmen'),
(958, 283, 'Los Mangos'),
-- Delicias (284)
(959, 284, 'Delicias Centro'),
(960, 284, 'Las Palmas'),
(961, 284, 'San José'),
-- La Tendida (285)
(962, 285, 'Bella Vista'),
(963, 285, 'La Tendida Centro'),
(964, 285, 'San Antonio'),
-- Umuquena (286)
(965, 286, 'La Concordia'),
(966, 286, 'San Miguel'),
(967, 286, 'Umuquena Centro'),
-- Seboruco (287)
(968, 287, 'Pueblo Nuevo'),
(969, 287, 'Santa Rosa'),
(970, 287, 'Seboruco Centro'),
-- San Simón (288)
(971, 288, 'La Trinidad'),
(972, 288, 'Las Acacias'),
(973, 288, 'San Simón Centro'),
-- Queniquea (289)
(974, 289, 'El Paraíso'),
(975, 289, 'El Samán'),
(976, 289, 'Queniquea Centro'),
-- San Josecito (290)
(977, 290, 'Campo Lindo'),
(978, 290, 'La Floresta'),
(979, 290, 'San Josecito Centro'),
-- Pregonero (291)
(980, 291, 'Los Samanes'),
(981, 291, 'Pregonero Centro'),
(982, 291, 'Santa Inés'),
-- Trujillo (292)
(983, 292, 'El Cementerio'),
(984, 292, 'La Plazuela'),
(985, 292, 'Pampán'),
(986, 292, 'San Jacinto'),
(987, 292, 'Trujillo Centro'),
-- Valera (293)
(988, 293, 'El Muro'),
(989, 293, 'La Cejita'),
(990, 293, 'La Plata'),
(991, 293, 'Menchito'),
(992, 293, 'San Luis'),
(993, 293, 'Valera Centro'),
-- Boconó (294)
(994, 294, 'Boconó Centro'),
(995, 294, 'El Rosario'),
(996, 294, 'Las Flores'),
-- Sabana de Mendoza (295)
(997, 295, 'El Carmen'),
(998, 295, 'Los Mangos'),
(999, 295, 'Sabana de Mendoza Centro'),
-- Carache (296)
(1000, 296, 'Carache Centro'),
(1001, 296, 'Las Palmas'),
(1002, 296, 'San José'),
-- Escuque (297)
(1003, 297, 'Bella Vista'),
(1004, 297, 'Escuque Centro'),
(1005, 297, 'San Antonio'),
-- La Quebrada (298)
(1006, 298, 'La Concordia'),
(1007, 298, 'La Quebrada Centro'),
(1008, 298, 'San Miguel'),
-- Chejendé (299)
(1009, 299, 'Chejendé Centro'),
(1010, 299, 'Pueblo Nuevo'),
(1011, 299, 'Santa Rosa'),
-- El Dividive (300)
(1012, 300, 'El Dividive Centro'),
(1013, 300, 'La Trinidad'),
(1014, 300, 'Las Acacias'),
-- Campo Elías (301)
(1015, 301, 'Campo Elías Centro'),
(1016, 301, 'El Paraíso'),
(1017, 301, 'El Samán'),
-- El Sombrero (302)
(1018, 302, 'Campo Lindo'),
(1019, 302, 'El Sombrero Centro'),
(1020, 302, 'La Floresta'),
-- Motatán (303)
(1021, 303, 'Los Samanes'),
(1022, 303, 'Motatán Centro'),
(1023, 303, 'Santa Inés'),
-- La Ceiba (304)
(1024, 304, 'El Rosario'),
(1025, 304, 'La Ceiba Centro'),
(1026, 304, 'Las Flores'),
-- Carvajal (305)
(1027, 305, 'Carvajal Centro'),
(1028, 305, 'El Carmen'),
(1029, 305, 'Los Mangos'),
-- Monay (306)
(1030, 306, 'Las Palmas'),
(1031, 306, 'Monay Centro'),
(1032, 306, 'San José'),
-- Pampán (307)
(1033, 307, 'Bella Vista'),
(1034, 307, 'Pampán Centro'),
(1035, 307, 'San Antonio'),
-- Pampanito (308)
(1036, 308, 'La Concordia'),
(1037, 308, 'Pampanito Centro'),
(1038, 308, 'San Miguel'),
-- Betijoque (309)
(1039, 309, 'Betijoque Centro'),
(1040, 309, 'Pueblo Nuevo'),
(1041, 309, 'Santa Rosa'),
-- San Luis (310)
(1042, 310, 'La Trinidad'),
(1043, 310, 'Las Acacias'),
(1044, 310, 'San Luis Centro'),
-- Santa Isabel (311)
(1045, 311, 'El Paraíso'),
(1046, 311, 'El Samán'),
(1047, 311, 'Santa Isabel Centro'),
-- Sabana Grande (312)
(1048, 312, 'Campo Lindo'),
(1049, 312, 'La Floresta'),
(1050, 312, 'Sabana Grande Centro'),
-- Santa Apolonia (313)
(1051, 313, 'Los Samanes'),
(1052, 313, 'Santa Apolonia Centro'),
(1053, 313, 'Santa Inés'),
-- El Paradero (314)
(1054, 314, 'El Paradero Centro'),
(1055, 314, 'El Rosario'),
(1056, 314, 'Las Flores'),
-- Monte Carmelo (315)
(1057, 315, 'El Carmen'),
(1058, 315, 'Los Mangos'),
(1059, 315, 'Monte Carmelo Centro'),
-- San Felipe (316)
(1060, 316, 'El Chaguaramo'),
(1061, 316, 'La Trigaleña'),
(1062, 316, 'Las Flores'),
(1063, 316, 'Los Sauces'),
(1064, 316, 'San Felipe Centro'),
-- Nirgua (317)
(1065, 317, 'Las Palmas'),
(1066, 317, 'Nirgua Centro'),
(1067, 317, 'San José'),
-- Yaritagua (318)
(1068, 318, 'Bella Vista'),
(1069, 318, 'San Antonio'),
(1070, 318, 'Yaritagua Centro'),
-- Cocorote (319)
(1071, 319, 'Cocorote Centro'),
(1072, 319, 'La Concordia'),
(1073, 319, 'San Miguel'),
-- Chivacoa (320)
(1074, 320, 'Chivacoa Centro'),
(1075, 320, 'Pueblo Nuevo'),
(1076, 320, 'Santa Rosa'),
-- Guama (321)
(1077, 321, 'Guama Centro'),
(1078, 321, 'La Trinidad'),
(1079, 321, 'Las Acacias'),
-- Aroa (322)
(1080, 322, 'Aroa Centro'),
(1081, 322, 'El Paraíso'),
(1082, 322, 'El Samán'),
-- Sabana de Parra (323)
(1083, 323, 'Campo Lindo'),
(1084, 323, 'La Floresta'),
(1085, 323, 'Sabana de Parra Centro'),
-- Yumare (324)
(1086, 324, 'Los Samanes'),
(1087, 324, 'Santa Inés'),
(1088, 324, 'Yumare Centro'),
-- Farriar (325)
(1089, 325, 'El Rosario'),
(1090, 325, 'Farriar Centro'),
(1091, 325, 'Las Flores'),
-- Marín (326)
(1092, 326, 'El Carmen'),
(1093, 326, 'Los Mangos'),
(1094, 326, 'Marín Centro'),
-- Urachiche (327)
(1095, 327, 'Las Palmas'),
(1096, 327, 'San José'),
(1097, 327, 'Urachiche Centro'),
-- Albarico (328)
(1098, 328, 'Albarico Centro'),
(1099, 328, 'Bella Vista'),
(1100, 328, 'San Antonio'),
-- Independencia (329)
(1101, 329, 'Independencia Centro'),
(1102, 329, 'La Concordia'),
(1103, 329, 'San Miguel'),
-- San Pablo (330)
(1104, 330, 'Pueblo Nuevo'),
(1105, 330, 'San Pablo Centro'),
(1106, 330, 'Santa Rosa'),
-- Boraure (331)
(1107, 331, 'Boraure Centro'),
(1108, 331, 'La Trinidad'),
(1109, 331, 'Las Acacias'),
-- Maracaibo (332)
(1110, 332, 'Coro'),
(1111, 332, 'El Empedrado'),
(1112, 332, 'El Milagro'),
(1113, 332, 'El Saladillo'),
(1114, 332, 'La Curva de Molina'),
(1115, 332, 'La Limpia'),
(1116, 332, 'La Pomona'),
(1117, 332, 'Los Haticos'),
(1118, 332, 'Luis Hurtado Higuera'),
(1119, 332, 'Sabaneta'),
(1120, 332, 'San Francisco'),
(1121, 332, 'Santa Lucía'),
(1122, 332, 'Urbanización La Lago'),
(1123, 332, 'Veritas'),
(1124, 332, 'Ziruma'),
-- Cabimas (333)
(1125, 333, 'Cabimas Centro'),
(1126, 333, 'El Paraíso'),
(1127, 333, 'El Samán'),
-- Sinamaica (334)
(1128, 334, 'Campo Lindo'),
(1129, 334, 'La Floresta'),
(1130, 334, 'Sinamaica Centro'),
-- Carrasquero (335)
(1131, 335, 'Carrasquero Centro'),
(1132, 335, 'Los Samanes'),
(1133, 335, 'Santa Inés'),
-- San Francisco (336)
(1134, 336, 'El Rosario'),
(1135, 336, 'Las Flores'),
(1136, 336, 'San Francisco Centro'),
-- Pueblo Nuevo (337)
(1137, 337, 'El Carmen'),
(1138, 337, 'Los Mangos'),
(1139, 337, 'Pueblo Nuevo Centro'),
-- Santa Rita (338)
(1140, 338, 'Las Palmas'),
(1141, 338, 'San José'),
(1142, 338, 'Santa Rita Centro'),
-- San Carlos del Zulia (339)
(1143, 339, 'Bella Vista'),
(1144, 339, 'San Antonio'),
(1145, 339, 'San Carlos del Zulia Centro'),
-- El Chivo (340)
(1146, 340, 'El Chivo Centro'),
(1147, 340, 'La Concordia'),
(1148, 340, 'San Miguel'),
-- Machiques (341)
(1149, 341, 'Machiques Centro'),
(1150, 341, 'Pueblo Nuevo'),
(1151, 341, 'Santa Rosa'),
-- La Concepción (342)
(1152, 342, 'La Concepción Centro'),
(1153, 342, 'La Trinidad'),
(1154, 342, 'Las Acacias'),
-- Bachaquero (343)
(1155, 343, 'Bachaquero Centro'),
(1156, 343, 'El Paraíso'),
(1157, 343, 'El Samán'),
-- Mene Grande (344)
(1158, 344, 'Campo Lindo'),
(1159, 344, 'La Floresta'),
(1160, 344, 'Mene Grande Centro'),
-- La Villa del Rosario (345)
(1161, 345, 'La Villa del Rosario Centro'),
(1162, 345, 'Los Samanes'),
(1163, 345, 'Santa Inés'),
-- Los Puertos de Altagracia (346)
(1164, 346, 'El Rosario'),
(1165, 346, 'Las Flores'),
(1166, 346, 'Los Puertos de Altagracia Centro'),
-- El Toro (347)
(1167, 347, 'El Carmen'),
(1168, 347, 'El Toro Centro'),
(1169, 347, 'Los Mangos'),
-- San Timoteo (348)
(1170, 348, 'Las Palmas'),
(1171, 348, 'San José'),
(1172, 348, 'San Timoteo Centro'),
-- Encontrados (349)
(1173, 349, 'Bella Vista'),
(1174, 349, 'Encontrados Centro'),
(1175, 349, 'San Antonio'),
-- Casigua El Cubo (350)
(1176, 350, 'Casigua El Cubo Centro'),
(1177, 350, 'La Concordia'),
(1178, 350, 'San Miguel'),
-- Concepción (351)
(1179, 351, 'Concepción Centro'),
(1180, 351, 'Pueblo Nuevo'),
(1181, 351, 'Santa Rosa'),
-- Ciudad Ojeda (352)
(1182, 352, 'Ciudad Ojeda Centro'),
(1183, 352, 'La Trinidad'),
(1184, 352, 'Las Acacias'),
-- San Rafael del Moján (353)
(1185, 353, 'El Paraíso'),
(1186, 353, 'El Samán'),
(1187, 353, 'San Rafael del Moján Centro'),
-- Tía Juana (354)
(1188, 354, 'Campo Lindo'),
(1189, 354, 'La Floresta'),
(1190, 354, 'Tía Juana Centro'),
-- Bobures (355)
(1191, 355, 'Bobures Centro'),
(1192, 355, 'Los Samanes'),
(1193, 355, 'Santa Inés')

-- Reset sequence
SELECT setval(pg_get_serial_sequence('sectores', 'id'), 1193);