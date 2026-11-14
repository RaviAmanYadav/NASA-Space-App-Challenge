
package com.astra.health.repository;

import com.astra.health.entity.Astronaut;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AstronautRepository
        extends JpaRepository<Astronaut, Long> {
            
}
